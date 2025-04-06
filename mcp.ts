#!/usr/bin/env -S deno run -A
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "npm:zod";
import SWIPL from "npm:swipl-wasm";

// Prologデータベースにルールや事実を追加するヘルパー関数
async function assertProlog(swipl: any, predicate: string): Promise<void> {
  await swipl.prolog.query(`assert((${predicate})).`).once();
}

// Prologデータベースにルールや事実を追加するヘルパー関数
async function assertzProlog(swipl: any, predicate: string): Promise<void> {
  await swipl.prolog.query(`assertz((${predicate})).`).once();
}

// Prologプログラム全体を読み込むヘルパー関数
async function loadPrologProgram(swipl: any, program: string): Promise<string[]> {
  return await swipl.prolog.load_string(program);
}

// メインサーバー実装
async function main() {
  // SWI-Prolog インスタンスをリセットするヘルパー関数
  async function resetSWIProlog(): Promise<void> {
    console.log("Resetting SWI-Prolog instance...");
    swipl = await SWIPL({ arguments: ["-q"] });
    console.log("SWI-Prolog instance reset.");
  }

  console.log("Initializing Prolog WASM...");
  let swipl = await SWIPL({ arguments: ["-q"] });
  
  console.log("Setting up knowledge base...");
  
  // サンプル知識ベースをセットアップ
  await assertProlog(swipl, "parent(john, bob)");
  await assertProlog(swipl, "parent(john, alice)");
  await assertProlog(swipl, "parent(mary, bob)");
  await assertProlog(swipl, "parent(mary, alice)");
  await assertProlog(swipl, "parent(bob, charlie)");
  await assertProlog(swipl, "parent(alice, david)");
  
  // 関係を定義
  await assertProlog(swipl, "grandparent(X, Z) :- parent(X, Y), parent(Y, Z)");
  await assertProlog(swipl, "sibling(X, Y) :- parent(Z, X), parent(Z, Y), X \\= Y");
  
  console.log("Creating MCP server...");
  const server = new McpServer({
    name: "PrologMCP",
    version: "1.0.0",
  });

  // クエリ実行ツール: 任意のPrologクエリを実行
  server.tool(
    "query",
    {
      query: z.string().describe("Prologクエリを入力します"),
    },
    async ({ query }) => {
      try {
        const results: any[] = [];
        const queryObj = swipl.prolog.query(query);
        
        // すべての解を取得
        for (let i = 0; i < 100; i++) {
          const solution = queryObj.next()
          results.push(solution);
          if (solution.done) {
            break;
          }
        }
        
        return {
          content: [{ 
            type: "text", 
            text: results.length > 0 ? 
              JSON.stringify(results, null, 2) : 
              "クエリに対する解がありませんでした。" 
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `エラー: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // 家族関係照会ツール: 特定の関係を見つける
  server.tool(
    "findRelation",
    {
      relation: z.enum(["parent", "grandparent", "sibling"]).describe("調べたい関係の種類"),
      person: z.string().describe("起点となる人物"),
    },
    async ({ relation, person }) => {
      try {
        const results = [];
        const queryObj = swipl.prolog.query(`${relation}(${person}, X).`);
        
        let solution;
        while ((solution = queryObj.next())) {
          if (solution.X) {
            results.push(solution.X);
          }
        }
        
        return {
          content: [{ 
            type: "text", 
            text: results.length > 0 ? 
              `${person}の${relation}は: ${results.join(", ")}` : 
              `${person}には${relation}の関係がありません。` 
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `エラー: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // 知識ベース追加ツール: 新しい事実やルールを追加
  server.tool(
    "assertz",
    {
      predicate: z.string().describe("追加したいPrologの述語 (例: parent(david, eve))"),
    },
    async ({ predicate }) => {
      try {
        await assertzProlog(swipl, predicate);
        return {
          content: [{ type: "text", text: `知識ベースに追加されました: ${predicate}` }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `エラー: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // SWI-Prolog インスタンスをリセットするツール
  server.tool(
    "resetProlog",
    {},
    async () => {
      try {
        await resetSWIProlog();
        return {
          content: [{ type: "text", text: "SWI-Prolog インスタンスがリセットされました。" }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `エラー: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Prologプログラム全体を読み込むツール
  server.tool(
    "loadProgram",
    {
      program: z.string().describe("読み込みたいPrologプログラム全体 (複数の述語やルールを含む)"),
    },
    async ({ program }) => {
      try {
        swipl.prolog.load_string
        const results = await loadPrologProgram(swipl, program);
        return {
          content: [{ 
            type: "text", 
            text: `プログラムの読み込み結果:\n${JSON.stringify(results)}` 
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `エラー: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // 知識ベース全体を取得するリソース
  // server.resource("knowledgeBase", "prolog://knowledgeBase", async () => {
  //   try {
  //     const listing = await swipl.prolog.query("listing.").once();
  //     return {
  //       contents: [
  //         {
  //           mimeType: "text/plain",
  //           text: listing ? listing.toString() : "知識ベースは空です。"
  //         }
  //       ]
  //     };
  //   } catch (error) {
  //     throw new Error(`知識ベースの取得中にエラーが発生しました: ${error.message}`);
  //   }
  // });

  // サーバー起動
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Prolog MCP Server is running on stdio");
}

// メイン関数実行
main().catch(console.error);

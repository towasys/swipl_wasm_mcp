# Prolog MCP (Model Context Protocol) サーバー

TypeScript、Deno、Prolog WASMを利用したMCPサーバーの実装です。Prologの論理プログラミング機能をClaude AIから利用できるようになります。

## 概要

このMCPサーバーは、SWI-Prologを WebAssembly を通じて実行し、Prologの推論エンジンをClaude AIに提供します。家族関係のサンプル知識ベースがあらかじめ登録されています。

## インストール

### Clineへのインストール
`cline_mcp_settings.json`に下記を追加する。
```
"prolog": {
   "command": "PATH_TO_DENO",
   "args": [
      "run",
      "-A",
      "PATH_TO_THIS_PROJECT_DIR/mcp.ts"
   ],
   "env": {},
   "disabled": false,
   "autoApprove": [
      "query",
      "findRelation",
      "assertz",
      "resetProlog",
      "loadProgram"
   ],
   "timeout": 30
}
```

### Claude Desktopへのインストール
エラーが出るが、下記を`claude_desktop_config.json`に追加するとClaude Desktopで動く。
```
"prolog": {
   "command": "PATH_TO_DENO",
   "args": [
      "run",
      "-A",
      "PATH_TO_THIS_PROJECT_DIR/mcp.ts"
   ]
}
```

## 機能

このMCPサーバーは以下のツールとリソースを提供します：

### ツール

1. **query** - 任意のPrologクエリを実行するツール
   - パラメータ: `query` (string) - 実行するPrologクエリ

2. **findRelation** - 特定の家族関係を照会するツール
   - パラメータ: 
     - `relation` (enum) - `parent`, `grandparent`, `sibling` のいずれか
     - `person` (string) - 起点となる人物の名前

3. **assertz** - 新しい事実やルールを知識ベースに追加するツール
   - パラメータ: `predicate` (string) - 追加したいPrologの述語

4. **resetProlog** - SWI-Prologインスタンスをリセットするツール
   - パラメータ: なし - 知識ベースを初期状態に戻します

5. **loadProgram** - Prologプログラム全体を一括で読み込むツール
   - パラメータ: `program` (string) - 読み込みたいPrologプログラム全体（複数の述語やルールを含む）

## サンプルの知識ベース

初期状態では、以下の家族関係のデータが登録されています：

```prolog
parent(john, bob).
parent(john, alice).
parent(mary, bob).
parent(mary, alice).
parent(bob, charlie).
parent(alice, david).

grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
sibling(X, Y) :- parent(Z, X), parent(Z, Y), X \= Y.
```

家族関係図:
```
john --- mary
  |       |
  |       |
  v       v
 bob --- alice
  |       |
  v       v
charlie  david
```

## 使用例

### 1. 基本的なクエリ実行

Prologクエリを実行するには `query` ツールを使います。

例: ジョンの子供を調べる
```
query: parent(john, X).
```

### 2. 家族関係の照会

特定の関係を調べるには `findRelation` ツールを使います。

例: ジョンの親を探す
```
relation: parent
person: john
```

例: Bobの兄弟姉妹を探す
```
relation: sibling
person: bob
```

### 3. 知識ベースへの追加

新しい事実やルールを追加するには `assertz` ツールを使います。

例: 新しい家族関係を追加
```
predicate: parent(david, eve)
```

### 4. プログラム全体の読み込み

複数の述語やルールを含むPrologプログラム全体を一括で読み込むには `loadProgram` ツールを使います。

例: 新しい家族関係のプログラムを読み込む
```
program: 
parent(eve, frank).
parent(frank, grace).
likes(X, Y) :- parent(X, Y).
likes(X, Y) :- parent(Y, X).
```

各行は個別に処理され、成功または失敗の結果が返されます。

### 5. Prologインスタンスのリセット

知識ベースを初期状態に戻すには `resetProlog` ツールを使います。

```
resetProlog
```

## 技術詳細

- **Deno**: JavaScriptとTypeScriptのランタイム
- **SWI-Prolog WASM**: WebAssembly経由でPrologを実行
- **MCP SDK**: Model Context Protocolの実装
- **Zod**: スキーマ検証ライブラリ

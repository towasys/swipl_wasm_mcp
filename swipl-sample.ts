import SWIPL from "swipl-wasm";

async function main() {
  const swipl = await SWIPL({ arguments: ["-q"] });

  const res = swipl.prolog.query("member(X, [a, b, c]).");
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())
  console.log(res.next())

  const listing = await swipl.prolog.query("listing.").once();
  console.log(listing);
}

main();
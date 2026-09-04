/**
 * The key-parsing trap, demonstrated — and the safe pattern.
 *
 * Run: node parse-key-safely.mjs
 * Requires: npm install @hiero-ledger/sdk   (no network, no account needed)
 */

import { PrivateKey } from "@hiero-ledger/sdk";

const ed = PrivateKey.generateED25519();
const ec = PrivateKey.generateECDSA();

const same = (a, b) => a.publicKey.toStringRaw() === b.publicKey.toStringRaw();
const row = (label, fn, expected) => {
  let outcome;
  try {
    outcome = same(fn(), expected) ? "correct" : "WRONG KEY (no error thrown)";
  } catch (e) {
    outcome = `threw: ${e.message.slice(0, 40)}`;
  }
  console.log(`  ${label.padEnd(42)} ${outcome}`);
};

console.log("Both curves are 32 raw bytes — nothing can reject the wrong one:");
console.log(`  ED25519 raw: ${ed.toStringRaw().length / 2} bytes`);
console.log(`  ECDSA   raw: ${ec.toStringRaw().length / 2} bytes\n`);

console.log("Parsing an ED25519 key:");
row("fromStringDer(der)", () => PrivateKey.fromStringDer(ed.toStringDer()), ed);
row("fromString(der)", () => PrivateKey.fromString(ed.toStringDer()), ed);
row("fromStringED25519(raw)", () => PrivateKey.fromStringED25519(ed.toStringRaw()), ed);
row("fromStringECDSA(raw)   <-- the trap", () => PrivateKey.fromStringECDSA(ed.toStringRaw()), ed);
row("fromStringECDSA(der)   <-- also wrong", () => PrivateKey.fromStringECDSA(ed.toStringDer()), ed);

console.log("\nParsing an ECDSA key:");
row("fromStringDer(der)", () => PrivateKey.fromStringDer(ec.toStringDer()), ec);
row("fromStringECDSA(raw)", () => PrivateKey.fromStringECDSA(ec.toStringRaw()), ec);
row("fromString(raw)        <-- defaults ED25519", () => PrivateKey.fromString(ec.toStringRaw()), ec);

console.log("\nThe safe pattern — store DER, parse with fromStringDer():");
for (const [name, key] of [["ED25519", ed], ["ECDSA", ec]]) {
  const parsed = PrivateKey.fromStringDer(key.toStringDer());
  console.log(`  ${name.padEnd(8)} round-trips correctly: ${same(parsed, key)}   (type: ${parsed.publicKey.type})`);
}

console.log("\nEVM address availability:");
console.log(`  ECDSA   .toEvmAddress(): ${ec.publicKey.toEvmAddress()}`);
try {
  console.log(`  ED25519 .toEvmAddress(): ${ed.publicKey.toEvmAddress()}`);
} catch (e) {
  console.log(`  ED25519 .toEvmAddress(): throws — ${e.message}`);
}

console.log("\nDER prefixes identify the curve:");
console.log(`  ED25519: ${ed.toStringDer().slice(0, 32)}…`);
console.log(`  ECDSA  : ${ec.toStringDer().slice(0, 32)}…`);

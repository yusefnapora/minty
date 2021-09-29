import { ECDSA_P256, encodeKey, SHA3_256 } from "@onflow/util-encode-key";
import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";
const ec = new EC("p256");

export const encodeServiceKey = (flowAccountPublicKey: string) => {
  return encodeKey(flowAccountPublicKey, ECDSA_P256, SHA3_256, 1000);
};

const hashMsgHex = (msgHex: string) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msgHex, "hex"));
  return sha.digest();
};

export function sign(privateKey: string, msgHex: string) {
  const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
  const sig = key.sign(hashMsgHex(msgHex));
  const n = 32; // half of signature length(?)
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);
  return Buffer.concat([r, s]).toString("hex");
}

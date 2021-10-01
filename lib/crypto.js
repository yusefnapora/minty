const {
  ECDSA_P256,
  ECDSA_secp256k1,
  SHA2_256,
  SHA3_256
} = require("@onflow/util-encode-key");
const { createHash } = require("crypto");
const { ec: EC } = require("elliptic");
const { SHA3 } = require("sha3");

const SigAlgos = {
  ECDSA_P256: ECDSA_P256,
  ECDSA_secp256k1: ECDSA_secp256k1
};

const HashAlgos = {
  SHA2_256: SHA2_256,
  SHA3_256: SHA3_256
};

const hashSHA2 = (msg) => {
  const sha = createHash("sha256");
  sha.update(Buffer.from(msg, "hex"));
  return sha.digest();
};

const hashSHA3 = (msg) => {
  const sha = new SHA3(256);
  sha.update(Buffer.from(msg, "hex"));
  return sha.digest();
};

const signers = {
  ECDSA_P256: () => new EC("p256"),
  ECDSA_secp256k1: () => new EC("secp256k1")
};

const hashers = {
  SHA2_256: hashSHA2,
  SHA3_256: hashSHA3
};

const getSigner = (sigAlgo) => signers[sigAlgo]();
const getHasher = (hashAlgo) => hashers[hashAlgo];

function signWithKey(privateKey, sigAlgo, hashAlgo, msg) {
  const signer = getSigner(sigAlgo);
  const hasher = getHasher(hashAlgo);

  const key = signer.keyFromPrivate(Buffer.from(privateKey, "hex"));

  const sig = key.sign(hasher(msg));

  const n = 32;
  const r = sig.r.toArrayLike(Buffer, "be", n);
  const s = sig.s.toArrayLike(Buffer, "be", n);

  return Buffer.concat([r, s]).toString("hex");
}

module.exports = {
  SigAlgos,
  HashAlgos,
  signWithKey
};

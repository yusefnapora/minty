const fcl = require("@onflow/fcl");
const { ec: EC } = require("elliptic");
const { SHA3 } = require("sha3");
const ec = new EC("p256");

class FlowService {
  constructor(minterFlowAddress, minterPrivateKeyHex, minterAccountIndex) {
    this.minterFlowAddress = minterFlowAddress;
    this.minterPrivateKeyHex = minterPrivateKeyHex;
    this.minterAccountIndex = minterAccountIndex;
  }

  authorizeMinter = () => {
    return async (account = {}) => {
      const user = await this.getAccount(this.minterFlowAddress);
      const key = user.keys[this.minterAccountIndex];

      const sign = this.signWithKey;
      const pk = this.minterPrivateKeyHex;

      return {
        ...account,
        tempId: `${user.address}-${key.index}`,
        addr: fcl.sansPrefix(user.address),
        keyId: Number(key.index),
        signingFunction: (signable) => {
          return {
            addr: fcl.withPrefix(user.address),
            keyId: Number(key.index),
            signature: sign(pk, signable.message)
          };
        }
      };
    };
  };

  getAccount = async (addr) => {
    const { account } = await fcl.send([fcl.getAccount(addr)]);
    return account;
  };

  signWithKey = (privateKey, msg) => {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
    const sig = key.sign(this.hashMsg(msg));
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r, s]).toString("hex");
  };

  hashMsg = (msg) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msg, "hex"));
    return sha.digest();
  };

  sendTx = async ({ transaction, args, proposer, authorizations, payer }) => {
    const response = await fcl.send([
      fcl.transaction`
        ${transaction}
      `,
      fcl.args(args),
      fcl.proposer(proposer),
      fcl.authorizations(authorizations),
      fcl.payer(payer),
      fcl.limit(9999)
    ]);
    return await fcl.tx(response).onceSealed();
  };

  async executeScript({ script, args }) {
    const response = await fcl.send([fcl.script`${script}`, fcl.args(args)]);
    return await fcl.decode(response);
  }

  async getLatestBlockHeight() {
    const block = await fcl.send([fcl.getBlock(true)]);
    const decoded = await fcl.decode(block);
    return decoded.height;
  }
}

module.exports = FlowService;

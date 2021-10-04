const fcl = require("@onflow/fcl");
const { signWithKey } = require("../flow/crypto");
class FlowService {
  constructor(minterFlowAddress, minterPrivateKeyHex, minterAccountIndex) {
    this.minterFlowAddress = minterFlowAddress;
    this.minterPrivateKeyHex = minterPrivateKeyHex;
    this.minterAccountIndex = minterAccountIndex;
  }

  authorizeMinter(pk = this.minterPrivateKeyHex) {
    return async (account = {}) => {
      const user = await this.getAccount(this.minterFlowAddress);
      const key = user.keys[this.minterAccountIndex];
      return {
        ...account,
        tempId: `${user.address}-${key.index}`,
        addr: fcl.sansPrefix(user.address),
        keyId: Number(key.index),
        signingFunction: (signable) => {
          return {
            addr: fcl.withPrefix(user.address),
            keyId: Number(key.index),
            signature: signWithKey(
              pk,
              // TODO: These are the emulator defaults,
              // And we'll use these to create a testnet account
              // Consider setting defaults from env
              // eg. https://github.com/onflow/faucet/blob/main/lib/config.ts
              "ECDSA_P256",
              "SHA3_256",
              signable.message
            )
          };
        }
      };
    };
  }

  async getAccount(addr) {
    const { account } = await fcl.send([fcl.getAccount(addr)]);
    return account;
  }

  async sendTx({ transaction, args, proposer, authorizations, payer }) {
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
  }

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

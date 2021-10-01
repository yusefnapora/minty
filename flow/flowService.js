const fcl = require("@onflow/fcl");
// const t = require("@onflow/types");
// const { encodeKey } = require("@onflow/util-encode-key");
// const fs = require("fs/promises");
// const path = require("path");
const { signWithKey, SigAlgos, HashAlgos } = require("../lib/crypto");
class FlowService {
  constructor(minterFlowAddress, minterPrivateKeyHex, minterAccountIndex) {
    this.minterFlowAddress = minterFlowAddress;
    this.minterPrivateKeyHex = minterPrivateKeyHex;
    this.minterAccountIndex = minterAccountIndex;
  }

  authorizeMinter() {
    return async (account = {}) => {
      const user = await this.getAccount(this.minterFlowAddress);
      const key = user.keys[this.minterAccountIndex];

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

  // createAccount = async (publicKey, sigAlgo, hashAlgo, authorization) => {
  //   const encodedPublicKey = encodeKey(publicKey, sigAlgo, hashAlgo, 1000);

  //   let transaction = await fs.readFile(
  //     path.join(__dirname, `./cadence/transactions/create_account.cdc`),
  //     "utf8"
  //   );

  //   const result = await this.sendTx({
  //     transaction,
  //     args: [fcl.arg(encodedPublicKey, t.String), fcl.arg(0, t.UFix64)],
  //     authorizations: [authorization],
  //     payer: authorization,
  //     proposer: authorization
  //   });

  //   const accountCreatedEvent = result.events.find(
  //     (event) => event.type === accountCreatedEventType
  //   );

  //   if (!accountCreatedEvent) {
  //     throw "Transaction did not emit account creation event";
  //   }

  //   const address = accountCreatedEvent.data.address;
  //   const transactionId = accountCreatedEvent.transactionId;

  //   return {
  //     address,
  //     transactionId
  //   };
  // };

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

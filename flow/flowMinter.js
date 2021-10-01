const t = require("@onflow/types");
const fcl = require("@onflow/fcl");
const FlowService = require("./flowService");
const fs = require("fs/promises");
const path = require("path");
const config = require("getconfig");
const { getParams } = require("../util/params-helpers");
const batch = require("../util/batch");

//////////////////////////////////////////////
// -------- Helpers
//////////////////////////////////////////////

const collate = (px) => {
  return Object.keys(px).reduce(
    (acc, key) => {
      acc.keys.push(key);
      acc.addresses.push(px[key][0]);
      acc.ids.push(px[key][1]);
      return acc;
    },
    { keys: [], addresses: [], ids: [] }
  );
};

//////////////////////////////////////////////
// -------- Flow Minter
//////////////////////////////////////////////

class FlowMinter {
  constructor() {
    this.flowService = null;
    this.nonFungibleTokenAddress = null;
    this.nftContractAddress = null;
    this.nonFungibleTokenPath = null;
    this.nftContractPath = null;
    this.params = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) {
      return;
    }

    this.params = await getParams();

    // Not the filesystem path, the path to the contract
    // as written in the cadence files. Used to do string
    // replacement, path -> Flow address
    this.nonFungibleTokenPath = '"../contracts/NonFungibleToken.cdc"';
    this.nftContractPath = `"../contracts/${this.params.name}.cdc"`;

    this.flowService = new FlowService(
      config.adminFlowAccount,
      config.adminFlowPrivateKey,
      0 // account index (keyId)
    );
    // The address of the NFT contract interface
    this.nonFungibleTokenAddress = config.nonFungibleTokenAddress;
    // The address of the new custom NFT contract
    this.nftContractAddress = config.adminFlowAccount;
    this._initialized = true;
  }

  async setupAccount() {
    const authorization = this.flowService.authorizeMinter();

    let transaction = await fs.readFile(
      path.join(__dirname, `./cadence/transactions/setup_account.cdc`),
      "utf8"
    );

    transaction = transaction
      .replace(
        this.nonFungibleTokenPath,
        fcl.withPrefix(this.nonFungibleTokenAddress)
      )
      .replace(this.nftContractPath, fcl.withPrefix(this.nftContractAddress));

    return this.flowService.sendTx({
      transaction,
      args: [],
      authorizations: [authorization],
      payer: authorization,
      proposer: authorization
    });
  }

  async mint(recipient, metadata) {
    const authorization = this.flowService.authorizeMinter();

    let transaction = await fs.readFile(
      path.join(__dirname, `./cadence/transactions/mint.cdc`),
      "utf8"
    );

    transaction = transaction
      .replace(
        this.nonFungibleTokenPath,
        fcl.withPrefix(this.nonFungibleTokenAddress)
      )
      .replace(this.nftContractPath, fcl.withPrefix(this.nftContractAddress));

    return this.flowService.sendTx({
      transaction,
      args: [fcl.arg(recipient, t.Address), fcl.arg(metadata, t.String)],
      authorizations: [authorization],
      payer: authorization,
      proposer: authorization
    });
  }

  async transfer(recipient, itemID) {
    const authorization = this.flowService.authorizeMinter();

    let transaction = await fs.readFile(
      path.join(__dirname, `./cadence/transactions/transfer.cdc`),
      "utf8"
    );

    transaction = transaction
      .replace(
        this.nonFungibleTokenPath,
        fcl.withPrefix(this.nonFungibleTokenAddress)
      )
      .replace(this.nftContractPath, fcl.withPrefix(this.nftContractAddress));

    return this.flowService.sendTx({
      transaction,
      args: [fcl.arg(recipient, t.Address), fcl.arg(itemID, t.UInt64)],
      authorizations: [authorization],
      payer: authorization,
      proposer: authorization
    });
  }

  async getNFTDetails(address, nftId) {
    let script = await fs.readFile(
      path.join(__dirname, `./cadence/scripts/get_nft.cdc`),
      "utf8"
    );

    script = script
      .replace(
        this.nonFungibleTokenPath,
        fcl.withPrefix(this.nonFungibleTokenAddress)
      )
      .replace(this.nftContractPath, fcl.withPrefix(this.nftContractAddress));

    const { enqueue } = batch("FETCH_ACCOUNT_ITEM", async (px) => {
      const { keys, addresses, ids } = collate(px);

      return this.flowService.executeScript({
        script,
        args: [
          fcl.arg(keys, t.Array(t.String)),
          fcl.arg(addresses, t.Array(t.Address)),
          fcl.arg(ids.map(Number), t.Array(t.UInt64))
        ]
      });
    });

    return enqueue(address, nftId);
  }
}

module.exports = FlowMinter;

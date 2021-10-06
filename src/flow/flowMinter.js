const FlowCliWrapper = require("./cli");
const t = require("@onflow/types")

class FlowMinter {

  constructor(network) {
    this.flow = new FlowCliWrapper(network);
    this.network = this.network || "emulator"
  }

  async deployContracts() {
    await this.flow.deploy();
  }

  async setupAccount() {
    return await this.flow.transaction(
      "./cadence/transactions/setup_account.cdc",
      `${this.network}-account`,
      []
    )
  }

  async mint(recipient, metadata) {
    return await this.flow.transaction(
      "./cadence/transactions/mint.cdc",
      `${this.network}-account`,
      [
        { type: t.Address, value: recipient },
        { type: t.String, value: metadata },
      ]
    )
  }

  async startDrop() {
    return await this.flow.transaction(
      "./cadence/transactions/start_drop.cdc",
      `${this.network}-account`,
      []
    )
  }

  async removeDrop() {
    return await this.flow.transaction(
      "./cadence/transactions/remove_drop.cdc",
      `${this.network}-account`,
      []
    )
  }

  async transfer(recipient, itemID) {
    // TODO
  }

  async getNFTDetails(address, nftId) {
    return await this.flow.script(
      "./cadence/scripts/get_nft.cdc",
      [
        { type: t.Address, value: address },
        { type: t.UInt64, value: Number(nftId) },
      ]
    )
  }
}

module.exports = FlowMinter;

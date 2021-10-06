const emulatorConfig = {
  flowAccessAPI: "http://localhost:8080",
  fclWalletDiscovery: "http://localhost:8701/fcl/authn",
  nonFungibleTokenAddress: "0xf8d6e0586b0a20c7",
  projectNFTContract: "0xf8d6e0586b0a20c7"
};

const testnetConfig = {
  flowAccessAPI: "https://access-testnet.onflow.org",
  fclWalletDiscovery: "https://fcl-discovery.onflow.org/testnet/authn",
  nonFungibleTokenAddress: "0x631e88ae7f1d7c20",
  projectNFTContract: process.env.FLOW_TESTNET_ADDRESS
};

const mainnetConfig = {
  flowAccessAPI: "",
  fclWalletDiscovery: "",
  nonFungibleTokenAddress: "",
  projectNFTContract: process.env.FLOW_MAINNET_ADDRESS
};

function getConfig(network) {
  switch (network) {
    case "testnet":
      return testnetConfig;
    case "mainnet":
      return mainnetConfig;
    default:
      return emulatorConfig;
  }
}

module.exports = {
  webpack: (config, _options) => {
    config.module.rules.push({
      test: /\.cdc/,
      type: "asset/source"
    });
    return config;
  },
  publicRuntimeConfig: getConfig(process.env.NETWORK)
};

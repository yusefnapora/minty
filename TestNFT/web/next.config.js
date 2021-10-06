module.exports = {
  webpack: (config, _options) => {
    config.module.rules.push({
      test: /\.cdc/,
      type: "asset/source"
    });
    return config;
  },
  publicRuntimeConfig: {
    appName: process.env.APP_NAME,
    flowAccessAPI: process.env.FLOW_ACCESS_API,
    fclWalletDiscovery: process.env.FCL_WALLET_DISCOVERY,
    nonFungibleTokenAddress: process.env.NON_FUNGIBLE_TOKEN_ADDRESS,
    projectNFTContract: process.env.PROJECT_CONTRACT_ADDRESS
  }
};

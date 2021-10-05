const config = {
  //////////////////////////////////////////////
  // ------ App Configs
  //////////////////////////////////////////////

  // Store IPFS NFT asset & metadata CIDs and data before pushing to the live network
  // https://github.com/rarepress/nebulus
  nebulusPath: "../ipfs-data",
  mintDataPath: "../mint-data",

  // Location of NFT metadata and assets for minting
  nftDataPath: "../NFT-Datasheet.csv",
  nftAssetPath: "../assets",

  // How fast to batch mint txs
  RATE_LIMIT_MS: 2000,

  //////////////////////////////////////////////
  // ------ IPFS Configs
  //////////////////////////////////////////////

  // The pinningService config tells minty what remote pinning service to use for pinning the IPFS data for a token.
  // The values are read in from environment variables, to discourage checking credentials into source control.
  // You can make things easy by creating a .env file with your environment variable definitions. See the example files
  // pinata.env.example and nft.storage.env.example in this directory for templates you can use to get up and running.
  pinningService: {
    name: "$$PINNING_SERVICE_NAME",
    endpoint: "$$PINNING_SERVICE_ENDPOINT",
    key: "$$PINNING_SERVICE_KEY"
  },

  // When the Minty smart contract is deployed, the contract address and other details will be written to this file.
  // Commands that interact with the smart contract (minting, etc), will load the file to connect to the deployed contract.
  deploymentConfigFile: "minty-deployment.json",

  // If you're running IPFS on a non-default port, update this URL. If you're using the IPFS defaults, you should be all set.
  ipfsApiUrl: "$$IPFS_API_URL",

  // If you're running the local IPFS gateway on a non-default port, or if you want to use a public gatway when displaying IPFS gateway urls, edit this.

  ipfsGatewayUrl: "$$IPFS_GATEWAY_URL",

  //////////////////////////////////////////////
  // ------ Emulator Configs
  //////////////////////////////////////////////

  emulatorHTTPEndpoint: "$$FLOW_EMULATOR_HTTP_ENDPOINT",
  emulatorGRPCEndpoint: "$$FLOW_EMULATOR_GRPC_ENDPOINT",

  // This is the default owner address and signing key for all newly minted NFTs
  emulatorFlowAccount: "$$FLOW_EMULATOR_ACCOUNT_ADDRESS",
  emulatorFlowPrivateKey: "$$FLOW_EMULATOR_ACCOUNT_PRIVATE_KEY",

  emulatorFungibleTokenAddress: "$$FLOW_EMULATOR_FUNGIBLE_TOKEN_ADDRESS",
  emulatorNonFungibleTokenAddress: "$$FLOW_EMULATOR_NON_FUNGIBLE_TOKEN_ADDRESS",

  //////////////////////////////////////////////
  // ------ Testnet Configs
  //////////////////////////////////////////////

  testnetHTTPEndpoint: "$$FLOW_TESTNET_HTTP_ENDPOINT",
  testnetGRPCEndpoint: "$$FLOW_TESTNET_GRPC_ENDPOINT",

  // This is the default owner address and signing key for all newly minted NFTs
  testnetFlowAccount: "$$FLOW_TESTNET_ACCOUNT_ADDRESS",
  testnetFlowPrivateKey: "$$FLOW_TESTNET_ACCOUNT_PRIVATE_KEY",

  testnetFungibleTokenAddress: "$$FLOW_TESTNET_FUNGIBLE_TOKEN_ADDRESS",
  testnetNonFungibleTokenAddress: "$$FLOW_TESTNET_NON_FUNGIBLE_TOKEN_ADDRESS"
};

module.exports = config;

const config = {

    // The pinningService config tells minty what remote pinning service to use for pinning the IPFS data for a token.
    // The values are read in from environment variables, to discourage checking credentials into source control.
    // You can make things easy by creating a .env file with your environment variable definitions. See the example files
    // pinata.env.example and nft.storage.env.example in this directory for templates you can use to get up and running.
    pinningService: {
        name: '$$PINNING_SERVICE_NAME',
        endpoint: '$$PINNING_SERVICE_ENDPOINT',
        key: '$$PINNING_SERVICE_KEY'
    },

    // When the Minty smart contract is deployed, the contract address and other details will be written to this file.
    // Commands that interact with the smart contract (minting, etc), will load the file to connect to the deployed contract.
    deploymentConfigFile: 'minty-deployment.json',

    // If you're running IPFS on a non-default port, update this URL. If you're using the IPFS defaults, you should be all set.
    ipfsApiUrl: 'http://localhost:5001',

    // If you're running the local IPFS gateway on a non-default port, or if you want to use a public gatway when displaying IPFS gateway urls, edit this.
    ipfsGatewayUrl: 'http://localhost:8080/ipfs',
}

module.exports = config
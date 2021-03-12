const config = {

    // The pinningService config tells minty what remote pinning service to use for pinning the IPFS data for a token.
    // The default config uses Pinata (https://pinata.cloud), and expects a JWT access token in the PINATA_API_TOKEN
    // environment variable.
    // 
    pinningService: {
        name: 'pinata',
        endpoint: 'https://api.pinata.cloud/psa',
        key: '$$PINATA_API_TOKEN'
    },

    // When the Minty smart contract is deployed, the contract address and other details will be written to this file.
    // Commands that interact with the smart contract (minting, etc), will load the file to connect to the deployed contract.
    deploymentConfigFile: 'minty-deployment.json',

    // Set this to true to log the IPFS listen addresses when running minty commands
    showIPFSLogs: false,
}

module.exports = config
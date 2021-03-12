const config = {
    pinningServices: [
        {
            name: 'pinata',
            endpoint: 'https://api.pinata.cloud/psa',
            accessToken: '$PINATA_API_TOKEN'
        }
    ],

    // When the Minty smart contract is deployed, the contract address and other details will be written to this file.
    // Commands that interact with the smart contract (minting, etc), will load the file to connect to the deployed contract.
    deploymentConfigFile: 'minty-deployment.json',

    // Set this to true to log the IPFS listen addresses when running minty commands
    showIPFSLogs: false,
}

module.exports = config
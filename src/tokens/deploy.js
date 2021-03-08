
const {hardhatRuntime} = require('./runtime')
const CONTRACT_NAME = "Minty"

async function deployContract(name, symbol) {
    const hardhat = hardhatRuntime()
    const network = hardhat.network.name

    console.log(`deploying contract for token ${name} (${symbol}) to network "${network}"...`)
    const Minty = await hardhat.ethers.getContractFactory(CONTRACT_NAME)
    const minty = await Minty.deploy(name, symbol)

    await minty.deployed()
    console.log(`deployed contract for token ${name} (${symbol}) to ${minty.address} (network: ${network})`);

    // TODO: write the contract address, token name & symbol to a config file for later use

    // for now, try to get the contract by newing up a TokenMinter
    const {MakeTokenMinter} = require('./mint')
    const minter = await MakeTokenMinter({contractName: CONTRACT_NAME, contractAddress: minty.address})
    console.log('got a minter without blowing up')
}

module.exports = {
    deployContract
}

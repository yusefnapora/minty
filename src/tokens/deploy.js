
const {hardhat} = require('./runtime')


const CONTRACT_NAME = "Minty"

async function deployContract(name, symbol) {
    console.log(`deploying contract for token ${name} (${symbol})...`)
    const Minty = await hardhat.ethers.getContractFactory(CONTRACT_NAME)
    const minty = await Minty.deploy(name, symbol)

    await minty.deployed()
    console.log(`deployed contract for token ${name} (${symbol}) to ${minty.address}`);

    // TODO: write the contract address, token name & symbol to a config file for later use
}

module.exports = {
    deployContract
}

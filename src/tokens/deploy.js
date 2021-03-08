
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

    return deploymentInfo(hardhat, minty)
}

function deploymentInfo(hardhat, minty) {
    return {
        network: hardhat.network.name,
        contract: {
            name: CONTRACT_NAME,
            address: minty.address,
            signerAddress: minty.signer.address,
            abi: minty.interface.format(),
        },
    }
}

module.exports = {
    deployContract
}

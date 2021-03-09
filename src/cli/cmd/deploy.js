
const fs = require('fs/promises')
const {deployContract} = require('../../tokens')

async function deploy(options) {
    const info = await deployContract(options.name, options.symbol)

    // TODO: add option to control where to write deployment info
    const filename = 'minty-deployment.json'
    console.log(`writing deployment info to ${filename}`)
    await saveDeployInfo(filename, info)
}

async function saveDeployInfo(filename, info) {
    return fs.writeFile(filename, JSON.stringify(info, null, 2))
}

module.exports = {
    deploy
}

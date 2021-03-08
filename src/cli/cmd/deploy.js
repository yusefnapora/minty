
const {deployContract} = require('../../tokens/deploy')

async function deploy(options) {
    return deployContract(options.name, options.symbol)
}

module.exports = {
    deploy
}

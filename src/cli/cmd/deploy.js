
const {deployContract} = require('../../tokens/deploy')

async function deploy(options) {
    console.log('deploy opts: ', options)
    return deployContract(options.name, options.symbol)
}

module.exports = {
    deploy
}

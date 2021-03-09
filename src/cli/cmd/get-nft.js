
const {MakeMinty} = require('../../minty')

async function getNFT(tokenId, options) {

    // TODO: pull global options out / read config file and pass opts to MakeMinty
    const minty = await MakeMinty()

    const fetchCreationInfo = options.creationInfo
    const info = await minty.getNFT(tokenId, {fetchCreationInfo})
    console.log(info)
}

module.exports = {
    getNFT
}

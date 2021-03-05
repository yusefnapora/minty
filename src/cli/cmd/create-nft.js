
const {MakeMinty} = require('../../minty')

exports.createNFT = async(imagePath, options) => {

    // TODO: pull global options out / read config file and pass opts to MakeMinty
    const minty = await MakeMinty()

    const info = await minty.createNFTFromImageFile(imagePath, options)
    console.log(`we did it! token info: `, info)
}

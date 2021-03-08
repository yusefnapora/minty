
const {MakeAssetStorage} = require('../storage')

const defaultConfig = {
    pinningServices: [
        {
            name: "pinata",
            endpoint: "https://api.pinata.cloud/psa",
            accessToken: () => process.env['PINATA_API_TOKEN'],
        }
    ]
}

class Minty {
    constructor(config) {
        this.config = config || defaultConfig
        this.storage = null
        this._initialized = false
    }

    async init() {
        if (this._initialized) {
            return
        }

        const pinningServices = this.config.pinningServices || []
        this.storage = await MakeAssetStorage({pinningServices})
        this._initialized = true
    }

    async createNFTFromImageFile(filePath, options) {
        console.log(`creating a new NFT using image at ${filePath}`)

        const assetCid = await this.storage.addAsset(filePath)
        console.log('asset CID: ', assetCid)

        const metadata = await this.makeNFTMetadata(assetCid, options)
        const metadataCid = await this.storage.addAsset('metadata.json', JSON.stringify(metadata))
        console.log('metadata CID:', metadataCid)

        const ownerAddress = options.ownerAddress || 'some-eth-addr'
        const tokenId = await this.mintToken(ownerAddress, metadataCid)
        console.log('token ID:', tokenId)
        return {
            assetCid,
            metadataCid,
            tokenId
        }
    }

    async makeNFTMetadata(assetCid, options) {
        const {name, description} = options;
        // TODO: input validation

        const assetURI = `ipfs://${assetCid}`
        return {
            name,
            description,
            image: assetURI
        }
    }

    async mintToken(ownerAddress, metadataCID) {
        // TODO: blockchain bits
        return "fake-token-id-" + Math.random()
    }
}

async function MakeMinty(config = null) {
    const m = new Minty(config)
    await m.init()
    return m
}

module.exports = {
    MakeMinty,
}

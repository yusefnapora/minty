const {MakeAssetStorage} = require('../storage')
const {MakeTokenMinterWithConfigFile} = require('../tokens/mint')

const defaultConfig = {
    pinningServices: [
        {
            name: "pinata",
            endpoint: "https://api.pinata.cloud/psa",
            accessToken: () => process.env['PINATA_API_TOKEN'],
        }
    ],

    deploymentConfigFile: 'minty-deployment.json'
}

class Minty {
    constructor(config) {
        this.config = config || defaultConfig
        this.storage = null
        this.minter = null
        this._initialized = false
    }

    async init() {
        if (this._initialized) {
            return
        }

        // TODO: error handling
        const {deploymentConfigFile} = this.config
        this.minter = await MakeTokenMinterWithConfigFile(deploymentConfigFile)

        const pinningServices = this.config.pinningServices || []
        this.storage = await MakeAssetStorage({pinningServices})
        this._initialized = true
    }

    async createNFTFromImageFile(filePath, options) {
        await this.init()
        console.log(`creating a new NFT using image at ${filePath}`)

        const assetCid = await this.storage.addAsset(filePath)
        console.log('asset CID: ', assetCid)

        const metadata = await this.makeNFTMetadata(assetCid, options)
        const metadataCid = await this.storage.addAsset('metadata.json', JSON.stringify(metadata))
        console.log('metadata CID:', metadataCid)

        let ownerAddress = options.owner
        if (!ownerAddress) {
            ownerAddress = await this.minter.defaultOwnerAddress()
        }
        const tokenId = await this.mintToken(ownerAddress, metadataCid)
        console.log('token ID:', tokenId)
        return {
            assetCid,
            metadataCid,
            tokenId
        }
    }

    async makeNFTMetadata(assetCid, options) {
        await this.init()
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
        await this.init()
        return this.minter.mintToken(ownerAddress, metadataCID)
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

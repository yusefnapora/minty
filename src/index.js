const {MakeAssetStorage} = require('./storage')
const {MakeTokenMinterWithConfigFile} = require('./tokens')

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
        // console.log('token ID:', tokenId)
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

    /**
     * @typedef {object} ERC721Metadata
     * @property {?string} name
     * @property {?string} description
     * @property {string} image
     *
     * @param tokenId
     * @returns {Promise<{metadata: ERC721Metadata, metadataURI: string}>}
     */
    async getNFTMetadata(tokenId) {
        await this.init()

        const metadataURI = await this.minter.getTokenURI(tokenId)
        const metadataJsonString = await this.storage.getString(metadataURI)
        const metadata = JSON.parse(metadataJsonString)

        return {metadata, metadataURI}
    }

    /**
     *
     * @typedef {object} NFTInfo
     * @property {string} tokenId
     * @property {string} ownerAddress
     * @property {ERC721Metadata} metadata
     * @property {string} metadataURI
     * @property {?string} assetDataBase64
     * @property {?object} creationInfo
     * @property {string} creationInfo.creatorAddress
     * @property {number} creationInfo.blockNumber
     *
     * @param {string} tokenId
     * @param {object} opts
     * @param {?boolean} opts.fetchAsset - if true, asset data will be fetched from IPFS and returned in assetData
     * @param {?boolean} opts.fetchCreationInfo - if true, fetch historical info (creator address and block number)
     * @returns {Promise<NFTInfo>}
     */
    async getNFT(tokenId, opts) {
        await this.init()

        const {metadata, metadataURI} = await this.getNFTMetadata(tokenId)
        const ownerAddress = await this.minter.getTokenOwner(tokenId)
        const nft = {tokenId, metadata, metadataURI, ownerAddress}

        const {fetchAsset, fetchCreationInfo} = (opts || {})
        if (metadata.image && fetchAsset) {
            nft.assetDataBase64 = await this.storage.getBase64String(metadata.image)
        }

        if (fetchCreationInfo) {
            nft.creationInfo = await this.minter.getCreationInfo(tokenId)
        }
        return nft
    }

    get hardhat() {
        return this.minter.hardhat
    }

    get contractAddress() {
        return this.minter.contractAddress
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

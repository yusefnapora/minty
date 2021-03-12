const fs = require('fs/promises')
const path = require('path')

const IPFS = require('ipfs-core')
const all = require('it-all')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')

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
        this.ipfs = undefined
        this.pinningServices = []
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

        // create a local IPFS node
        const silent = false // set to true to suppress IPFS log output
        this.ipfs = await IPFS.create({silent})

        // tell IPFS to use each configured pinning service
        for (const svc of this.config.pinningServices) {
            const {name, endpoint} = svc
            let key = svc.accessToken
            if (typeof svc.accessToken === 'function') {
                key = svc.accessToken()
            }

            // FIXME: this will fail if the service has already been added. check if it exists first.
            await this.ipfs.pin.remote.service.add(name, {endpoint, key})
            this.pinningServices.push(name)
        }

        this._initialized = true
    }

    async createNFTFromAssetData(content, options) {
        // add the asset to IPFS
        const filePath = options.path || ''
        const { cid: assetCid } = await this.ipfs.add({ path: path.basename(filePath), content })

        // make the NFT metadata JSON
        const metadata = await this.makeNFTMetadata(assetCid, options)

        // add the metadata to IPFS
        const { cid: metadataCid } = await this.ipfs.add({ path: 'metadata.json', content: JSON.stringify(metadata)} )
        
        // get the address of the token owner from options, or use the default signing address if no owner is given
        let ownerAddress = options.owner
        if (!ownerAddress) {
            ownerAddress = await this.minter.defaultOwnerAddress()
        }

        // mint a new token referencing the metadata CID
        const tokenId = await this.minter.mintToken(ownerAddress, metadataCid)

        return {
            tokenId,
            metadata,
            assetCid,
            metadataCid,
        }
    }

    async createNFTFromAssetFile(filePath, options) {
        const content = await fs.readFile(filePath)
        return this.createNFTFromAssetData(content, {...options, path: filePath})
    }

    async makeNFTMetadata(assetCid, options) {
        const {name, description} = options;
        const assetURI = `ipfs://${assetCid}`
        return {
            name,
            description,
            image: assetURI
        }
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
        const metadataURI = await this.minter.getTokenURI(tokenId)
        const metadata = await this.getIPFSJSON(metadataURI)

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
        const {metadata, metadataURI} = await this.getNFTMetadata(tokenId)
        const ownerAddress = await this.minter.getTokenOwner(tokenId)
        const nft = {tokenId, metadata, metadataURI, ownerAddress}

        const {fetchAsset, fetchCreationInfo} = (opts || {})
        if (metadata.image && fetchAsset) {
            nft.assetDataBase64 = await this.getIPFSBase64(metadata.image)
        }

        if (fetchCreationInfo) {
            nft.creationInfo = await this.minter.getCreationInfo(tokenId)
        }
        return nft
    }


    // --------- IPFS helpers

    async getIPFS(cidOrURI) {
        let cid = cidOrURI
        if (cidOrURI.startsWith('ipfs://')) {
            cid = cidOrURI.slice('ipfs://'.length)
        }

        return uint8ArrayConcat(await all(this.ipfs.cat(cid)))
    }

    async getIPFSString(cidOrURI) {
        const bytes = await this.get(cidOrURI)
        return uint8ArrayToString(bytes)
    }

    async getIPFSBase64(cidOrURI) {
        const bytes = await this.get(cidOrURI)
        return uint8ArrayToString(bytes, 'base64')
    }

    async getIPFSJSON(cidOrURI) {
        const str = await this.getIPFSString(cidOrURI)
        return JSON.parse(str)
    }


    // -------- pinning 

    async pinCid(cid) {
        if (this.pinningServices.length < 1) {
            console.log('no pinning services configured, unable to pin ' + cid)
            return
        }


        // pin to all services in parallel and await the result
        const promises = []
        for (const service of this.pinningServices) {
            promises.push(this._pinIfUnpinned(cid, service))
        }
        try {
            await Promise.all(promises)
            console.log('pinned cid ', cid)
        } catch (e) {
            // TODO: propagate errors
            console.error("Pinning error: ", e)
        }
    }

    async _pinIfUnpinned(cid, service) {
        const pinned = await this.isPinned(cid, service)
        if (pinned) {
            console.log(`cid ${cid} already pinned`)
            return
        }
        await this.ipfs.pin.remote.add(cid, {service, background: false})
    }

    async isPinned(cid, service) {
        for await (const result of this.ipfs.pin.remote.ls({cid: [cid], service})) {
            return true
        }
        return false
    }


    // ------ contract info

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

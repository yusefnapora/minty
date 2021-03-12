const fs = require('fs/promises')
const path = require('path')
const IPFS = require('ipfs-core')
const all = require('it-all')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')
const config = require('getconfig')
const hardhat = require('hardhat')


const { loadDeploymentInfo } = require('./deploy')

/**
 * Minty is the main object 
 */
class Minty {
    constructor() {
        this.ipfs = undefined
        this.pinningServices = []
        this._initialized = false
    }

    async init() {
        if (this._initialized) {
            return
        }

        // the Minty object expects that the contract has already been deployed, with
        // details written to a deployment info file. The default location is `./minty-deployment.json`,
        // in the config.
        this.deployInfo = await loadDeploymentInfo()

        // connect to the smart contract using the address and ABI from the deploy info
        const {abi, address} = this.deployInfo.contract
        this.contract = await hardhat.ethers.getContractAt(abi, address)

        // create a local IPFS node
        const silent = !config.showIPFSLogs
        this.ipfs = await IPFS.create({silent})

        this._initialized = true
    }

    // ------ NFT Creation

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
            ownerAddress = await this.defaultOwnerAddress()
        }

        // mint a new token referencing the metadata CID
        const tokenId = await this.mintToken(ownerAddress, metadataCid)

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


    // -------- NFT Retreival

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
        const metadataURI = await this.getTokenURI(tokenId)
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
        const ownerAddress = await this.getTokenOwner(tokenId)
        const nft = {tokenId, metadata, metadataURI, ownerAddress}

        const {fetchAsset, fetchCreationInfo} = (opts || {})
        if (metadata.image && fetchAsset) {
            nft.assetDataBase64 = await this.getIPFSBase64(metadata.image)
        }

        if (fetchCreationInfo) {
            nft.creationInfo = await this.getCreationInfo(tokenId)
        }
        return nft
    }


    // --------- Smart contract interactions

    async mintToken(ownerAddress, metadataCID) {
        await this.init()

        console.log('minting new token for metadata CID: ', metadataCID)

        // Call the mintToken method to issue a new token to the given address
        // This returns a transaction object, but the transaction hasn't been confirmed
        // yet, so it doesn't have our token id.
        const tx = await this.contract.mintToken(ownerAddress, metadataCID.toString())

        // The OpenZeppelin base ERC721 contract emits a Transfer event when a token is issued.
        // tx.wait() will wait until a block containing our transaction has been mined and confirmed.
        // The transaction receipt contains events emitted while processing the transaction.
        const receipt = await tx.wait()
        for (const event of receipt.events) {
            if (event.event !== 'Transfer') {
                console.log('ignoring unknown event type ', event.event)
                continue
            }
            return event.args.tokenId.toString()
        }

        throw new Error('unable to get token id')
    }

    async defaultOwnerAddress() {
        const signers = await hardhat.ethers.getSigners()
        return signers[0].address
    }

    async getTokenURI(tokenId) {
        await this.init()
        const result = await this.contract.tokenURI(BigNumber.from(tokenId))
        // console.log(`found URI for token ${tokenId}: ${result}`)
        return result
    }

    async getTokenOwner(tokenId) {
        await this.init()
        return this.contract.ownerOf(tokenId)
    }

    async getCreationInfo(tokenId) {
        await this.init()

        const filter = await this.contract.filters.Transfer(
            null,
            null,
            BigNumber.from(tokenId)
        )

        const logs = await this.contract.queryFilter(filter)
        const blockNumber = logs[0].blockNumber
        const creatorAddress = logs[0].args.to
        return {
            blockNumber,
            creatorAddress,
        }
    }

    // --------- IPFS helpers

    async getIPFS(cidOrURI) {
        const cid = stripIpfsUriPrefix(cidOrURI)
        return uint8ArrayConcat(await all(this.ipfs.cat(cid)))
    }

    async getIPFSString(cidOrURI) {
        const bytes = await this.getIPFS(cidOrURI)
        return uint8ArrayToString(bytes)
    }

    async getIPFSBase64(cidOrURI) {
        const bytes = await this.getIPFS(cidOrURI)
        return uint8ArrayToString(bytes, 'base64')
    }

    async getIPFSJSON(cidOrURI) {
        const str = await this.getIPFSString(cidOrURI)
        return JSON.parse(str)
    }


    // -------- Pinning to remote services

    /**
     * Pins all IPFS data associated with the given tokend id to the remote pinning service.
     * @param {*} tokenId - the ID of an NFT that was previously minted.
     * @returns {Promise<{assetURI: string, metadataURI: string}>} - the IPFS asset and metadata uris that were pinned.
     * @throws if no token with the given id exists, or if pinning fails.
     */
    async pinTokenData(tokenId) {
        const {metadata, metadataURI} = await this.getNFTMetadata(tokenId)
        const {image: assetURI} = metadata
        
        console.log(`Pinning asset data (${assetURI}) for token id ${tokenId}....`)
        await this.pin(assetURI)

        console.log(`Pinning metadata (${metadataURI}) for token id ${tokenId}...`)
        await this.pin(metadataURI)

        return {assetURI, metadataURI}
    }

    /**
     * Request that the remote pinning service pin the given CID or ipfs URI.
     * @param {string} cidOrURI - a CID or ipfs:// URI
     * @returns {Promise<void>}
     */
    async pin(cidOrURI) {
        const cid = stripIpfsUriPrefix(cidOrURI)

        // Make sure IPFS is set up to use our preferred pinning service.
        await this._configurePinningService()

        // Check if we've already pinned this CID to avoid a "duplicate pin" error.
        const pinned = await this.isPinned(cid)
        if (pinned) {
            return
        }

        // Ask the remote service to pin the content.
        // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
        // and fetch the data using Bitswap, IPFS's transfer protocol.
        await this.ipfs.pin.remote.add(cid, {
            service: config.pinningService.name, 
            background: false
        })
    }


    /**
     * Check if a cid is already pinned.
     * @param {string} cid 
     * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
     */
    async isPinned(cid) {
        const opts = {
            service: config.pinningService.name,
            cid: [cid], // ls expects an array of cids
        }
        for await (const result of this.ipfs.pin.remote.ls(opts)) {
            return true
        }
        return false
    }

    /**
     * Configure IPFS to use the remote pinning service from our config.
     * @private
     */
    async _configurePinningService() {
        if (!config.pinningService) {
            throw new Error(`No pinningService set up in minty config. Unable to pin.`)
        }

        // check if the service has already been added to js-ipfs
        for (const svc of await this.ipfs.pin.remote.service.ls()) {
            if (svc.service === config.pinningService.name) {
                // service is already configured, no need to do anything
                return
            }
        }

        // add the service to IPFS
        const { name, endpoint, key } = config.pinningService
        await this.ipfs.pin.remote.service.add(name, { endpoint, key })
    }
}


/**
 * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
 * @returns the input string with the `ipfs://` prefix stripped off
 */
function stripIpfsUriPrefix(cidOrURI) {
    if (cidOrURI.startsWith('ipfs://')) {
        return cidOrURI.slice('ipfs://'.length)
    }
    return cidOrURI
}

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Minty>} a new instance of Minty, ready to mint NFTs.
 */
async function MakeMinty() {
    const m = new Minty()
    await m.init()
    return m
}

module.exports = {
    MakeMinty,
}

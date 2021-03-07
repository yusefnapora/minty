// the storage module will be responsible for adding and pinning assets to IPFS and creating NFT metadata

const fs = require('fs').promises
const path = require('path')
const IPFS = require('ipfs-core')

const {PinningClient} = require('./pin')

/**
 * @typedef {Object} AssetStorageConfig
 * @property {Array<PinningServiceConfig>} pinningServices
 */

/**
 * AssetStorage coordinates storing assets to IPFS and pinning them for persistence.
 * Note that the class is not exported, since it requires async initialization.
 * @see MakeAssetStorage to construct.
 */
class AssetStorage {

    /**
     * @param {AssetStorageConfig} config
     */
    constructor(config) {
        this.config = config
        this._initialized = false
        this.ipfs = undefined
        this.pinningClients = []
    }

    async init() {
        if (this._initialized) {
            return
        }

        // TODO: customize IPFS config?
        this.ipfs = await IPFS.create()

        for (const svc of this.config.pinningServices) {
            const client = new PinningClient(svc, this.ipfs)
            this.pinningClients.push(client)
        }

        this._initialized = true
    }

    /**
     * addAsset adds the data from the file at `filename` to IPFS and "pins" it to make it
     * persistent so that it outlives the local IPFS node.
     *
     * If `assetData` is `null` or missing, the contents of `filename` will be read, if possible.
     * Note that if `assetData` is non-null, it will be used directly, and nothing will be read
     * from the local filesystem.
     *
     * @param filename - path to local file containing data, or descriptive filename to attach to the provided data.
     * @param assetData - if present, will be used instead of attempting to read files from disk.
     * @returns {Promise<string>} a Promise that resolves to a CID that can be used to fetch the file from IPFS,
     * or fails with an Error if something went wrong.
     */
    async addAsset(filename, assetData = null) {
        await this.init()

        // if the assetData is missing, try to read from the given filename
        if (assetData == null) {
            console.log('reading from ', filename)
            assetData = await fs.readFile(filename)
        }

        // Add the asset to IPFS
        const asset = await this.ipfs.add({
            path: path.basename(filename),
            content: assetData
        })

        console.log('added asset to IPFS: ', asset.cid)

        // Pin the asset to make it persistent
        await this.pin(asset.cid)
        return asset.cid
    }

    async pin(cid) {
        await this.init()

        if (this.pinningClients.length < 1) {
            console.log('no pinning services configured, unable to pin ' + cid)
            return
        }

        // pin to all services in parallel and await the result
        const promises = []
        for (const client of this.pinningClients) {
            promises.push(client.add(cid))
        }
        try {
            await Promise.all(promises)
            console.log('pinned cid ', cid)
        } catch (e) {
            console.error("Pinning error: ", e)
        }
    }
}

/**
 * MakeAssetStorage returns an initialized AssetStorage instance.
 * Prefer this to constructing an instance and manually calling .init()
 * @param {AssetStorageConfig} config
 * @returns {Promise<AssetStorage>}
 */
async function MakeAssetStorage(config) {
    const storage = new AssetStorage(config)
    await storage.init()
    return storage
}

module.exports = {
    MakeAssetStorage,
}

// the storage module will be responsible for adding and pinning assets to IPFS and creating NFT metadata

const fs = require('fs').promises
const path = require('path')
const IPFS = require('ipfs')

/**
 * AssetStorage coordinates storing assets to IPFS and pinning them for persistence.
 * Note that the class is not exported, since it requires async initialization.
 * @see MakeAssetStorage to construct.
 */
class AssetStorage {
    constructor() {
        this._initialized = false
        this.ipfs = undefined
    }

    async init() {
        if (this._initialized) {
            return
        }

        // TODO: customize IPFS config?
        this.ipfs = await IPFS.create()
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
        if (!this._initialized) {
            throw new Error("you must call .init() before using this object")
        }

        // if the assetData is missing, try to read from the given filename
        if (assetData == null) {
            console.log('reading from ', filename)
            assetData = await fs.readFile(filename)
        }

        console.log(`adding ${assetData.length} bytes to IPFS`)

        // Add the asset to IPFS
        const asset = await this.ipfs.add({
            path: path.basename(filename),
            content: assetData
        })

        console.log('added asset to IPFS: ', asset)

        // Pin the asset to make it persistent
        await this.pin(asset.cid)
        return asset.cid
    }

    async pin(cid) {
        // TODO: use pinning services API to request pin
        console.log("pretending to pin CID: ", cid)
    }
}

/**
 * MakeAssetStorage returns an initialized AssetStorage instance.
 * Prefer this to constructing an instance and manually calling .init()
 * @returns {Promise<AssetStorage>}
 */
async function MakeAssetStorage() {
    const storage = new AssetStorage()
    await storage.init()
    return storage
}

module.exports = {
    MakeAssetStorage,
}

// the storage module will be responsible for adding and pinning assets to IPFS and creating NFT metadata

const fs = require('fs').promises
const path = require('path')

const IPFS = require('ipfs-core')
const PinningClient = require('js-ipfs-pinning-service-client')
const all = require('it-all')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')


/**
 * AssetStorage coordinates storing assets to IPFS and pinning them for persistence.
 * Note that the class is not exported, since it requires async initialization.
 * @see MakeAssetStorage to construct.
 */
class AssetStorage {

    /**
     * @typedef {Object} AssetStorageConfig
     * @param {Array<PinningServiceConfig>} config.pinningServices
     *
     * @param {AssetStorageConfig} config
     */
    constructor(config) {
        this.config = config
        this._initialized = false
        this.ipfs = undefined
        this.pinners = []
    }

    async init() {
        if (this._initialized) {
            return
        }

        // TODO: customize IPFS config?
        this.ipfs = await IPFS.create({silent: true})

        for (const svc of this.config.pinningServices) {
            const client = new Pinner(svc, this.ipfs)
            this.pinners.push(client)
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

    /**
     * pin sends requests to all configured remote pinning services to pin the given CID.
     * @param cid
     * @returns {Promise<void>}
     */
    async pin(cid) {
        await this.init()

        if (this.pinners.length < 1) {
            console.log('no pinning services configured, unable to pin ' + cid)
            return
        }

        // pin to all services in parallel and await the result
        const promises = []
        for (const client of this.pinners) {
            promises.push(client.add(cid))
        }
        try {
            await Promise.all(promises)
            console.log('pinned cid ', cid)
        } catch (e) {
            // TODO: propagate errors
            console.error("Pinning error: ", e)
        }
    }

    async get(cidOrURI) {
        let cid = cidOrURI
        if (cidOrURI.startsWith('ipfs://')) {
            cid = cidOrURI.slice('ipfs://'.length)
        }

        return uint8ArrayConcat(await all(this.ipfs.cat(cid)))
    }

    async getString(cidOrURI) {
        const bytes = await this.get(cidOrURI)
        return uint8ArrayToString(bytes)
    }

    async getBase64String(cidOrURI) {
        const bytes = await this.get(cidOrURI)
        return uint8ArrayToString(bytes, 'base64')
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


/**
 * A Pinner coordinates requests to a remote IPFS Pinning Service,
 */
class Pinner {
    /**
     * construct a new Pinner for a pinning service
     *
     * @callback tokenProvider
     * @returns {string} a JWT access token for a pinning service
     *
     * @typedef {Object} PinningServiceConfig - configuration for the Pinning Service provider
     * @property {string} name - a short name for the pinning service, e.g. "pinata"
     * @property {string} endpoint - the HTTPS endpoint URL for the pinning service
     * @property {string|tokenProvider} accessToken - a JWT access token for the service,
     *   or a function that returns an access token
     *
     * @param {PinningServiceConfig} config
     * @param {IPFS} ipfs - local IPFS object
     */
    constructor(config, ipfs) {
        this.config = config
        this.ipfs = ipfs
        this.client = new PinningClient(config)
    }

    /**
     * Request that the pinning service add a pin for the given CID, and wait until the
     * service confirms success or failure.
     * @param cid {CID | string}
     * @param {object} options pin-specific options. may be omitted.
     * @param {string} options.name name for pinned data.
     * @param {object} options.meta arbitrary key/value metadata to attach to pin
     * @returns {Promise<void>}
     */
    async add(cid, options) {
        options = options || {}

        console.log(`pinning ${cid} to ${this.serviceName} with options: `, options)
        const alreadyPinned = await this.isPinned(cid)
        if (alreadyPinned) {
            console.log(`CID ${cid} already pinned, ignoring`)
            return
        }

        const {name, meta} = options
        const origins = await this._getOriginAddrs()
        const resp = await this.client.add({
            name,
            meta,
            origins,
            cid: cid,
        })

        await this._handlePinResponse(resp)
        return resp
    }

    /**
     * isPinned returns true if the given CID has been pinned by the remote service.
     * @param {String|CID} cid
     * @returns {Promise<boolean>}
     */
    async isPinned(cid) {
        const resp = await this.client.ls({cid})
        return resp.count > 0
    }

    /**
     * _getOriginAddrs is used to tell the remote pinning service how to find our IPFS content.
     * Without this, they would have to do a DHT lookup first, which would take longer.
     * @returns {Promise<Array<String>>} the string-encoded multiaddrs of the local IPFS node.
     * @private
     */
    async _getOriginAddrs() {
        const {addresses} = await this.ipfs.id()
        return addresses.map(a => a.toString())
    }

    /**
     * _handlePinResponse accepts a PinResponse object and tries to connect the local IPFS node
     * to all the addresses in the `delegates` field. This makes sure we can establish an IPFS
     * connection even if we're behind a restrictive NAT and the service can't dial us directly.j
     *
     * After trying to connect, we call _waitForPinCompletion
     * @param pinResponse a PinResponse object as returned by the remote service
     * @returns {Promise<void>} resolves with no value on success, or throws on error.
     * @private
     */
    async _handlePinResponse(pinResponse) {
        // console.log('pin response: ', JSON.stringify(pinResponse, null, 2))
        const addrs = pinResponse.delegates || []

        const promises = []
        for (const a of addrs) {
            console.log('connecting to ', a)
            promises.push(this.ipfs.swarm.connect(a))
        }
        try {
            await Promise.all(promises)
        } catch (e) {
            console.error('connection error: ', e)
        }

        return this._waitForPinCompletion(pinResponse)
    }

    /**
     * _waitForPinCompletion periodically polls the status of the pin referenced in the given PinResponse until
     * the pin request is successful or fails.
     * @param pinResponse a PinResponse object as returned by the remote service
     * @returns {Promise<void>} resolves with no value on success, or throws on error.
     * @private
     */
    async _waitForPinCompletion(pinResponse) {
        while (true) {
            // The status field is required, so if it's missing something went wrong.
            if (pinResponse.status == null) {
                throw new Error('pin response is missing required status field')
            }
            if (pinResponse.status === 'failed') {
                throw new Error(`pin request ${pinResponse.requestid} failed: ` + JSON.stringify(pinResponse.info))
            }

            if (pinResponse.status === 'pinned') {
                console.log(`CID ${pinResponse.pin.cid} pinned successfully`)
                return
            }


            const waitMs = 200
            console.log(`pin status for ${pinResponse.pin.cid}: ${pinResponse.status}. waiting ${waitMs} ms...`)
            await delay(waitMs)
            pinResponse = await this.client.get(pinResponse.requestid)
        }
    }

    /**
     * @returns {string} the name of the remote pinning service
     */
    get serviceName() {
        return this.config.name || 'unnamed pinning service'
    }
}

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

module.exports = {
    MakeAssetStorage,
}

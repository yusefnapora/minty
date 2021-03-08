const bent = require('bent')
const CID = require('cids')
const Multiaddr = require('multiaddr')

/**
 * Assorted JSDoc type definitions
 *
 * @typedef {Object} PinningServiceConfig
 * @property {string} name - a short name for the pinning service, e.g. "pinata"
 * @property {string} endpoint - the HTTPS endpoint URL for the pinning service
 * @property {string} accessToken - an API token for the service. If the token string starts with the special prefix "env:",
 *   the remainder of the string will be used as the name of an environment variable, which must be non-empty.
 */


/**
 * PinningClient is a basic client for the IPFS Pinning Service API
 * @see https://ipfs.github.io/pinning-services-api-spec/
 */
class PinningClient {
    /**
     * construct a new PinningClient for a pinning service
     * @param {PinningServiceConfig} config - configuration for the Pinning Service provider
     * @param {IPFS} ipfs - local ipfs object
     */
    constructor(config, ipfs) {
        this.config = config
        this.ipfs = ipfs

        const {endpoint, accessToken} = config

        let token = accessToken
        if (typeof accessToken === 'function') {
            token = accessToken()
        }

        const headers = {Authorization: `Bearer ${token}`}
        this.post = bent(endpoint, 'POST', 'json', headers, 200, 202) // POST, DEL, etc should return 202 on success
        this.get = bent(endpoint, 'json', headers)
    }

    /**
     * request that the pinning service add a pin for the given CID.
     * @param cid {CID | string}
     * @param {object} options pin-specific options. may be omitted.
     * @param {string} options.name name for pinned data.
     * @param {object} options.meta arbitrary key/value metadata to attach to pin
     * @returns {Promise<void>}
     */
    async add(cid, options) {
        if (!CID.isCID(cid)) {
            cid = new CID(cid)
        }
        options = options || {}

        console.log(`pinning ${cid} to ${this.serviceName} with options: `, options)
        const addrs = await this._getAddrs()
        const origins = addrs.map(a => a.toString())

        try {
            const alreadyPinned = await this.isPinned(cid)
            if (alreadyPinned) {
                console.log(`CID ${cid} already pinned, ignoring`)
                return
            }

            const {name, meta} = options
            const resp = await this.post('/pins', {
                name,
                meta,
                origins,
                cid: cid.toString(),
            })

            await this._handlePinResponse(resp)
            return resp
        } catch (e) {
            if (e.json != null) {
                const err = await e.json()
                console.error('error details: ', err)
                throw new Error('api error: ' + JSON.stringify(err))
            } else {
                throw e
            }
        }

    }

    async isPinned(cid) {
        const resp = await this.get('/pins?cid=' + cid)
        return resp.count > 0
    }

    async _getAddrs() {
        const {addresses} = await this.ipfs.id()
        return addresses
    }

    async _handlePinResponse(pinResponse) {
        console.log('pin requested: ', JSON.stringify(pinResponse, null, 2))
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

    async _waitForPinCompletion(pinResponse) {
        if (pinResponse.status == null) {
            throw new Error('pin response is missing required status field')
        }

        if (pinResponse.status === 'pinned') {
            console.log(`CID ${pinResponse.pin.cid} pinned successfully`)
            return
        }
        if (pinResponse.status === 'failed') {
            console.error(`pin request ${pinResponse.requestid} failed: `, pinResponse.info)
            return
        }

        const waitMs = 200
        console.log(`pin status for ${pinResponse.pin.cid}: ${pinResponse.status}. waiting ${waitMs} ms...`)
        await delay(waitMs)
        pinResponse = await this.get(`/pins/${pinResponse.requestid}`)
        return this._waitForPinCompletion(pinResponse)
    }

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
    PinningClient
}

const bent = require('bent')
const CID = require('cids')
const Multiaddr = require('multiaddr')

/**
 * Assorted JSDoc type definitions
 *
 * @callback AddrProvider
 * @description an async function that returns the local IPFS node's listen addresses, so the pinning service can
 *  find our content.
 * @returns Promise<Array<Multiaddr>> - resolves to an array of the local IPFS node's listen addresses
 *
 * @typedef {Object} PinningServiceConfig
 * @property {string} name - a short name for the pinning service, e.g. "pinata"
 * @property {string} endpoint - the HTTPS endpoint URL for the pinning service
 * @property {string} apiToken - an API token for the service. If the token string starts with the special prefix "env:",
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
     * @param {AddrProvider} addrProvider - async function to get the local node's IPFS addresses
     */
    constructor(config, addrProvider) {
        this.config = config
        this.getAddrs = addrProvider

        let {endpoint, apiToken} = config

        if (apiToken.startsWith('env:')) {
            const key = apiToken.slice(4)
            apiToken = process.env[key]
            if (apiToken == null) {
                throw new Error(`api token has magic "env:" prefix, but no env variable found named ${key}`)
            }
        }

        const headers = {Authorization: `Bearer ${apiToken}`}
        console.log('pinning api headers: ', headers)
        this.post = bent(endpoint, 'json', headers, 200, 202) // POST, DEL, etc should return 202 on success
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

        console.log(`pinning ${cid} to ${this.serviceName} with options: `, options)
        const addrs = await this.getAddrs()

        try {
            const origins = addrs.map(a => a.toString())

            const {name, meta} = (options || {})
            const resp = await this.post('/pins', {
                name,
                meta,
                origins,
                cid: cid.toString(),
            })

            console.log('pin added: ', resp)
            return resp
        } catch (e) {
            const msg = await e.text()
            console.error('api error: ', msg, e)
        }

    }

    get serviceName() {
        return this.config.name || 'unnamed pinning service'
    }
}

module.exports = {
    PinningClient
}

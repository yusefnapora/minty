
const {hardhatRuntime} = require('./runtime')

class TokenMinter {

    constructor(config) {
        this._validateConfig(config)

        this.config = config
        this.contract = null
        this._initialized = false
    }

    _validateConfig(config) {
        const required = arg => {
            if (!config.hasOwnProperty(arg)) {
                throw new Error(`required config option ${arg} not found`)
            }
        }

        required('contractName')
        required('contractAddress')
    }

    async init() {
        if (this._initialized) {
            return
        }

        const {contractName, contractAddress, contractSigner} = this.config
        const hardhat = hardhatRuntime()
        this.contract = await hardhat.ethers.getContractAt(contractName, contractAddress, contractSigner)
        console.log('got contract: ', this.contract)

        this._initialized = true
    }
}


async function MakeTokenMinter(config) {
    const minter = new TokenMinter(config)
    await minter.init()
    return minter
}

module.exports = {
    MakeTokenMinter,
}

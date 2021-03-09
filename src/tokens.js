
const {BigNumber} = require('ethers')
const hardhat = require('hardhat')

const CONTRACT_NAME = "Minty"

class TokenMinter {
    constructor(config) {
        this._validateConfig(config)

        this.config = config
        this.contract = null
        this._initialized = false
    }

    _validateConfig(config) {
        const {contract} = config
        if (!contract) {
            throw new Error('required config option "contract" not found')
        }
        const required = arg => {
            if (!config.contract.hasOwnProperty(arg)) {
                throw new Error(`required config option "contract.${arg}" not found`)
            }
        }

        required('name')
        required('address')
        required('abi')
    }

    async init() {
        if (this._initialized) {
            return
        }

        const {abi, address} = this.config.contract
        this.contract = await hardhat.ethers.getContractAt(abi, address)
        // console.log(`minter connected to contract at address ${address} (network: ${hardhat.network.name})`)
        this._initialized = true
    }

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

    get contractAddress() {
        return this.config.contract.address
    }
}

async function deployContract(name, symbol) {
    const network = hardhat.network.name

    console.log(`deploying contract for token ${name} (${symbol}) to network "${network}"...`)
    const Minty = await hardhat.ethers.getContractFactory(CONTRACT_NAME)
    const minty = await Minty.deploy(name, symbol)

    await minty.deployed()
    console.log(`deployed contract for token ${name} (${symbol}) to ${minty.address} (network: ${network})`);

    return deploymentInfo(hardhat, minty)
}

function deploymentInfo(hardhat, minty) {
    return {
        network: hardhat.network.name,
        contract: {
            name: CONTRACT_NAME,
            address: minty.address,
            signerAddress: minty.signer.address,
            abi: minty.interface.format(),
        },
    }
}



async function MakeTokenMinter(config) {
    const minter = new TokenMinter(config)
    await minter.init()
    return minter
}

async function MakeTokenMinterWithConfigFile(filename) {
    const fs = require('fs/promises')
    const content = await fs.readFile(filename, {encoding: 'utf8'})
    const config = JSON.parse(content)
    return MakeTokenMinter(config)
}

module.exports = {
    deployContract,
    MakeTokenMinter,
    MakeTokenMinterWithConfigFile,
}

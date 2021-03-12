#!/usr/bin/env node

// This is the main entry point for the command line `minty` app.
// See minty.js for the core functionality.

const fs = require('fs/promises')
const {Command} = require('commander')
const {MakeMinty} = require('./minty')
const {deployContract} = require('./tokens')

async function main() {
    const program = new Command()

    // commands
    program
        .command('create-nft <image-path>')
        .description('Create a new NFT from an image file')
        .option('-n, --name <name>', 'The name of the NFT')
        .option('-d, --description <desc>', 'A description of the NFT')
        .option('-o, --owner <address>', 'The ethereum address that should own the NFT.' +
            'If not provided, defaults to the first signing address.')
        .action(createNFT)

    program.command('get-nft <token-id>')
        .description('Get info about an NFT using its token ID')
        .option('-c, --creation-info', 'include the creator address and block number the NFT was minted')
        .action(getNFT)

    program.command('deploy')
        .description('deploy an instance of the Minty NFT contract')
        .option('-o, --output <deploy-file-path>', 'Path to write deployment info to', 'minty-deployment.json')
        .option('-n, --name <name>', 'The name of the token contract', 'Julep')
        .option('-s, --symbol <symbol>', 'A short symbol for the tokens in this contract', 'JLP')
        .action(deploy)

    await program.parseAsync(process.argv)
}

// ---- command action functions

async function createNFT(imagePath, options) {
    const minty = await MakeMinty()

    const info = await minty.createNFTFromAssetFile(imagePath, options)
    console.log(`we did it! token info: `, info)
}

async function getNFT(tokenId, options) {
    const minty = await MakeMinty()

    const fetchCreationInfo = options.creationInfo
    const info = await minty.getNFT(tokenId, {fetchCreationInfo})
    console.log(info)
}

async function deploy(options) {
    const info = await deployContract(options.name, options.symbol)

    const filename = options.output
    console.log(`writing deployment info to ${filename}`)
    await saveDeployInfo(filename, info)
}

async function saveDeployInfo(filename, info) {
    return fs.writeFile(filename, JSON.stringify(info, null, 2))
}


// ---- main entry point when running as a script

// make sure we catch all errors
main().then(() => {
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})

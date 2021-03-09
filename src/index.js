#!/usr/bin/env node

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
        .option('-n, --name <name>', 'The name of the token contract', 'Julep')
        .option('-s, --symbol <symbol>', 'A short symbol for the tokens in this contract', 'JLP')
        .action(deploy)

    await program.parseAsync(process.argv)
}

// ---- command action functions

async function createNFT(imagePath, options) {

    // TODO: pull global options out / read config file and pass opts to MakeMinty
    const minty = await MakeMinty()

    const info = await minty.createNFTFromImageFile(imagePath, options)
    console.log(`we did it! token info: `, info)
}

async function getNFT(tokenId, options) {

    // TODO: pull global options out / read config file and pass opts to MakeMinty
    const minty = await MakeMinty()

    const fetchCreationInfo = options.creationInfo
    const info = await minty.getNFT(tokenId, {fetchCreationInfo})
    console.log(info)
}

async function deploy(options) {
    const info = await deployContract(options.name, options.symbol)

    // TODO: add option to control where to write deployment info
    const filename = 'minty-deployment.json'
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

#!/usr/bin/env node

// The cli module defines the command line interface for the Minty app

const {Command} = require('commander')

const {createNFT} = require('./cmd/create-nft')
const {getNFT} = require('./cmd/get-nft')
const {deploy} = require('./cmd/deploy')

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

// make sure we catch all errors
main().then(() => {
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})

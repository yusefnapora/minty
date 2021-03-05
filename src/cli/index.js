#!/usr/bin/env node

// The cli module defines the command line interface for the Minty app

const {Command} = require('commander')

const {createNFT} = require('./cmd/create-nft')

async function main() {
    const program = new Command()
    program
        .command('create-nft <image-path>')
        .description('create a new NFT from an image file')
        .option('-n, --name', 'The name of the NFT')
        .option('-d, --description', 'A description of the NFT')
        .action(createNFT)


    await program.parseAsync(process.argv)
}

// make sure we catch all errors
main().then(() => {
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})

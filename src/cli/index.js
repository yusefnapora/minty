#!/usr/bin/env node

// The cli module defines the command line interface for the Minty app

const {Command} = require('commander')

const {createNFT} = require('./cmd/create-nft')
const {deploy} = require('./cmd/deploy')

const DEFAULT_NETWORK = 'localhost'

async function main() {
    const program = new Command()

    // global options
    program.option('--network <network>',
        'The ethereum network to use. Must be configured in hardhat.config.js',
        DEFAULT_NETWORK)

    // global options don't get merged with command options, so we set an event listener
    // to grab the value and muck with global state.  ¯\_(ツ)_/¯
    // see: https://github.com/tj/commander.js/issues/789
    program.on('option:network', function () {
        // the HARDHAT_NETWORK env variable gets picked up when you `require('hardhat')`
        process.env['HARDHAT_NETWORK'] = this.opts().network
    })

    // commands
    program
        .command('create-nft <image-path>')
        .description('Create a new NFT from an image file')
        .option('-n, --name <name>', 'The name of the NFT')
        .option('-d, --description <desc>', 'A description of the NFT')
        .option('-o, --owner <address>', 'The ethereum address that should own the NFT.' +
            'If not provided, defaults to the first signing address.')
        .action(createNFT)

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

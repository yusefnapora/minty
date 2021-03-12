#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

const fs = require('fs/promises')
const {Command} = require('commander')
const inquirer = require('inquirer')
const config = require('getconfig')
const {MakeMinty} = require('./minty')
const {deployContract, saveDeploymentInfo} = require('./deploy')

async function main() {
    const program = new Command()

    // commands
    program
        .command('mint <image-path>')
        .description('create a new NFT from an image file')
        .option('-n, --name <name>', 'The name of the NFT')
        .option('-d, --description <desc>', 'A description of the NFT')
        .option('-o, --owner <address>', 'The ethereum address that should own the NFT.' +
            'If not provided, defaults to the first signing address.')
        .action(createNFT)

    program.command('show <token-id>')
        .description('get info about an NFT using its token ID')
        .option('-c, --creation-info', 'include the creator address and block number the NFT was minted')
        .action(getNFT)

    program.command('pin <token-id>')
        .description('"pin" the data for an NFT to a remote IPFS Pinning Service')
        .action(pinNFTData)

    program.command('deploy')
        .description('deploy an instance of the Minty NFT contract')
        .option('-o, --output <deploy-file-path>', 'Path to write deployment info to', config.deploymentConfigFile || 'minty-deployment.json')
        .option('-n, --name <name>', 'The name of the token contract', 'Julep')
        .option('-s, --symbol <symbol>', 'A short symbol for the tokens in this contract', 'JLP')
        .action(deploy)

    await program.parseAsync(process.argv)
}

// ---- command action functions

async function createNFT(imagePath, options) {
    const minty = await MakeMinty()

    // prompt for missing details if not provided as cli args
    const answers = await promptForMissing(options, {
        name: {
            message: 'Enter a name for your new NFT: '
        },

        description: {
            message: 'Enter a description for your new NFT: '
        }
    })

    const nft = await minty.createNFTFromAssetFile(imagePath, answers)
    console.log('Minted new NFT: ', nft)
}

async function getNFT(tokenId, options) {
    const { creationInfo: fetchCreationInfo } = options
    const minty = await MakeMinty()
    const nft = await minty.getNFT(tokenId, {fetchCreationInfo})
    console.log(nft)
}

async function pinNFTData(tokenId) {
    const minty = await MakeMinty()
    const {assetURI, metadataURI} = await minty.pinTokenData(tokenId)
    console.log(`Pinned all data for token id ${tokenId}`)
}

async function deploy(options) {
    const filename = options.output
    const info = await deployContract(options.name, options.symbol)
    await saveDeploymentInfo(info, filename)
}

// ---- helpers

async function promptForMissing(cliOptions, prompts) {
    const questions = []
    for (const [name, prompt] of Object.entries(prompts)) {
        prompt.name = name
        prompt.when = (answers) => {
            if (cliOptions[name]) {
                answers[name] = cliOptions[name]
                return false
            }
            return true
        }
        questions.push(prompt)
    }
    return inquirer.prompt(questions)
}

// ---- main entry point when running as a script

// make sure we catch all errors
main().then(() => {
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})

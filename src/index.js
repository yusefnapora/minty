#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

const path = require("path");
const { Command } = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const colorize = require("json-colorizer");
const config = require("getconfig");
const { getParams, updateParams } = require("../util/params-helpers");
const { MakeMinty } = require("./minty");
const { generateCode } = require("./deploy");

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: "blue.bold",
    STRING_LITERAL: "green"
  }
};

async function main() {
  const program = new Command();
  const params = await getParams();
  // commands
  program
    .command("mint")
    .description("create multiple NFTs using data from a csv file")
    .option(
      "-d, --data <csv-path>",
      "The location of the csv file to use for minting",
      config.nftDataPath
    )
    .action(batchCreateNFT);

  program
    .command("mintone <image-path>")
    .description("create a new NFT from an image file")
    .option("-n, --name <name>", "The name of the NFT")
    .option("-d, --description <desc>", "A description of the NFT")
    .option(
      "-o, --owner <address>",
      "The Flow address that should own the NFT." +
        "If not provided, defaults to the first signing address."
    )
    .action(createNFT);

  program
    .command("show <token-id>")
    .description("get info from Flow about an NFT using its token ID")
    .action(getNFT);

  // program
  //   .command("transfer <token-id> <to-address>")
  //   .description("transfer an NFT to a new owner")
  //   .action(transferNFT);

  program
    .command("pin <token-id>")
    .description('"pin" the data for an NFT to a remote IPFS Pinning Service')
    .action(pinNFTData);

  program
    .command("deploy")
    .description("deploy an instance of the Minty NFT contract")
    .option(
      "-o, --output <deploy-file-path>",
      "Path to write deployment info to",
      config.deploymentConfigFile
    )
    .option(
      "-n, --name <name>",
      "The name of the token contract",
      params.name || config.defaultContractName
    )
    .option(
      "-s, --symbol <symbol>",
      "A short symbol for the tokens in this contract",
      params.symbol || config.defaultContractSymbol
    )
    .action(deploy);

  // The hardhat and getconfig modules both expect to be running from the root directory of the project,
  // so we change the current directory to the parent dir of this script file to make things work
  // even if you call minty from elsewhere
  const rootDir = path.join(__dirname, "..");
  process.chdir(rootDir);

  await program.parseAsync(process.argv);
}

// ---- command action functions

async function batchCreateNFT(options) {
  const minty = await MakeMinty();

  const answer = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `Create NFTs using data from ${path.basename(config.nftDataPath)}?`
  });

  if (!answer.confirm) return;

  const result = await minty.createNFTsFromCSVFile(options.data, (nft) => {
    console.log(colorize(JSON.stringify(nft), colorizeOptions));
  });

  console.log(`✨ Success! ${result.total} NFTs were minted! ✨`);
}

async function createNFT(assetPath, options) {
  const minty = await MakeMinty();

  // prompt for missing details if not provided as cli args
  const answers = await promptForMissing(options, {
    name: {
      message: "Enter a name for your new NFT: "
    },

    description: {
      message: "Enter a description for your new NFT: "
    }
  });

  const nft = await minty.createNFTFromAssetFile(assetPath, answers);
  console.log("✨ Minted a new NFT: ");

  alignOutput([
    ["Token ID:", chalk.green(nft.tokenId)],
    ["Metadata Address:", chalk.blue(nft.metadataURI)],
    ["Metadata Gateway URL:", chalk.blue(nft.metadataGatewayURL)],
    ["Asset Address:", chalk.blue(nft.assetURI)],
    ["Asset Gateway URL:", chalk.blue(nft.assetGatewayURL)]
  ]);
  console.log("NFT Metadata:");
  console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions));
}

async function getNFT(tokenId, options) {
  const { creationInfo: fetchCreationInfo } = options;
  const minty = await MakeMinty();
  const nft = await minty.getNFT(tokenId, { fetchCreationInfo });

  const output = [
    ["Token ID:", chalk.green(nft.tokenId)],
    ["Owner Address:", chalk.yellow(nft.ownerAddress)]
  ];

  output.push(["Metadata Address:", chalk.blue(nft.metadataURI)]);
  output.push(["Metadata Gateway URL:", chalk.blue(nft.metadataGatewayURL)]);
  output.push(["Asset Address:", chalk.blue(nft.assetURI)]);
  output.push(["Asset Gateway URL:", chalk.blue(nft.assetGatewayURL)]);
  alignOutput(output);

  console.log("NFT Metadata:");
  console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions));
}

async function transferNFT(tokenId, toAddress) {
  const minty = await MakeMinty();

  await minty.transferToken(tokenId, toAddress);
  console.log(
    `🌿 Transferred token ${chalk.green(tokenId)} to ${chalk.yellow(toAddress)}`
  );
}

async function pinNFTData(tokenId) {
  const minty = await MakeMinty();
  await minty.pinTokenData(tokenId);
  console.log(`🌿 Pinned all data for token id ${chalk.green(tokenId)}`);
}

async function deploy(options) {
  const minty = await MakeMinty();
  const filename = options.output;
  await updateParams(options.name, options.symbol);
  const info = await generateCode(options.name, options.symbol);
  if (!info) return;
  const result = await minty.deployContracts();
  console.log(filename, JSON.stringify(info, null, 2));
}

// ---- helpers

async function promptForMissing(cliOptions, prompts) {
  const questions = [];
  for (const [name, prompt] of Object.entries(prompts)) {
    prompt.name = name;
    prompt.when = (answers) => {
      if (cliOptions[name]) {
        answers[name] = cliOptions[name];
        return false;
      }
      return true;
    };
    questions.push(prompt);
  }
  return inquirer.prompt(questions);
}

function alignOutput(labelValuePairs) {
  const maxLabelLength = labelValuePairs
    .map(([l, _]) => l.length)
    .reduce((len, max) => (len > max ? len : max));
  for (const [label, value] of labelValuePairs) {
    console.log(label.padEnd(maxLabelLength + 1), value);
  }
}

// ---- main entry point when running as a script

// make sure we catch all errors
main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

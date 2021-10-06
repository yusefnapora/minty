#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

const path = require("path");
const { Command } = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const colorize = require("json-colorizer");
const ora = require("ora");
const { MakeMinty } = require("./minty");
const generateProject = require("./generate-project");
const generateWebAssets = require("./generate-web");

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: "blue.bold",
    STRING_LITERAL: "green"
  }
};

const spinner = ora();

async function main() {
  const program = new Command();

  // commands

  program
    .command("create")
    .description("initialize a new project")
    .action(init);

  program
    .command("mint")
    .description("create multiple NFTs using data from a csv file")
    .option(
      "-d, --data <csv-path>",
      "The location of the csv file to use for minting",
      "nfts.csv"
    )
    .action(batchMintNFT);

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
    .action(mintNFT);

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
      "-n, --network <name>",
      "Either: emulator, testnet, mainnet",
      "emulator"
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

async function init() {
  const questions = [
    {
      type: "input",
      name: "projectName",
      message: "What's your project name? (e.g. my-nft-project)"
    },
    {
      type: "input",
      name: "contractName",
      message: "What's your contract name? (e.g. MyNFT)"
    }
  ];

  const answers = await inquirer.prompt(questions);

  await generateProject(answers.projectName, answers.contractName);
  await generateWebAssets(answers.projectName, answers.projectName);

  console.log(
    `\nProject initialized in ./${answers.projectName}\n\ncd ${answers.projectName}`
  );
}

async function deploy({ network }) {
  const minty = await MakeMinty();

  spinner.start(`Deploying project to ${network}`);

  await minty.deployContracts();

  spinner.succeed(`✨ Success! Project deployed to ${network} ✨`);
}

async function batchMintNFT(options) {
  const minty = await MakeMinty();

  const answer = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `Create NFTs using data from ${path.basename(options.data)}?`
  });

  if (!answer.confirm) return;

  const result = await minty.createNFTsFromCSVFile(options.data, (nft) => {
    console.log(colorize(JSON.stringify(nft), colorizeOptions));
  });

  console.log(`✨ Success! ${result.total} NFTs were minted! ✨`);
}

async function mintNFT(assetPath, options) {
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
  const minty = await MakeMinty();
  const nft = await minty.getNFT(tokenId);

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

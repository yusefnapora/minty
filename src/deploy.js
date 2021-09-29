const fs = require("fs/promises");
const { F_OK } = require("fs");
const inquirer = require("inquirer");
const config = require("getconfig");
const codeGen = require("../util/codegen");
const { flowCliProjectDeployer } = require("../flow/cli-wrapper");
const fcl = require("@onflow/fcl");
fcl.config().put("accessNode.api", config.flowEmulatorHTTPEndpoint);

async function deployContract(name, symbol) {
  const deploymentInfo = deploymentInfoFormatter(name);
  await codeGen(name);
  await saveDeploymentInfo(deploymentInfo);
  await flowCliProjectDeployer();
  return deploymentInfo;
}

function deploymentInfoFormatter(contractName) {
  return {
    networks: {
      emulator: config.flowEmulatorGRPCEndpoint
    },
    accounts: {
      "emulator-account": {
        address: config.flowEmulatorAccountAddress,
        keys: config.flowEmulatorAccountPrivateKey
      }
    },
    contracts: {
      [contractName]: {
        source: `flow/cadence/contracts/${contractName}.cdc`,
        aliases: {
          emulator: config.flowEmulatorAccountAddress
        }
      },
      FungibleToken: {
        source: "flow/cadence/contracts/FungibleToken.cdc",
        aliases: {
          emulator: config.flowEmulatorFungibleTokenAddress
        }
      }
    },
    deployments: {
      emulator: {
        "emulator-account": [`${contractName}`]
      }
    }
  };
}

async function saveDeploymentInfo(info, filename = undefined) {
  if (!filename) {
    filename = config.deploymentConfigFile || "minty-deployment.json";
  }
  const exists = await fileExists(filename);
  if (exists) {
    const overwrite = await confirmOverwrite(filename);
    if (!overwrite) {
      return false;
    }
  }

  console.log(`Writing deployment info to ${filename}`);
  const content = JSON.stringify(info, null, 2);
  await fs.writeFile(filename, content, { encoding: "utf-8" });
  return true;
}

async function loadDeploymentInfo() {
  let { deploymentConfigFile } = config;
  if (!deploymentConfigFile) {
    console.log(
      'no deploymentConfigFile field found in minty config. attempting to read from default path "./minty-deployment.json"'
    );
    deploymentConfigFile = "minty-deployment.json";
  }
  const content = await fs.readFile(deploymentConfigFile, { encoding: "utf8" });
  const deployInfo = JSON.parse(content);
  try {
    validateDeploymentInfo(deployInfo);
  } catch (e) {
    throw new Error(
      `error reading deploy info from ${deploymentConfigFile}: ${e.message}`
    );
  }
  return deployInfo;
}

function validateDeploymentInfo(deployInfo) {
  const { contract } = deployInfo;
  if (!contract) {
    throw new Error('required field "contract" not found');
  }
  const required = (arg) => {
    if (!deployInfo.contract.hasOwnProperty(arg)) {
      throw new Error(`required field "contract.${arg}" not found`);
    }
  };

  required("networks");
  required("accounts");
  required("contracts");
  required("deployments");
}

async function fileExists(path) {
  try {
    await fs.access(path, F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

async function confirmOverwrite(filename) {
  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "overwrite",
      message: `File ${filename} exists. Overwrite it?`,
      default: false
    }
  ]);
  return answers.overwrite;
}

module.exports = {
  deployContract,
  loadDeploymentInfo,
  saveDeploymentInfo
};

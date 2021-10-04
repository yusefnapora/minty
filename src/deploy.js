const fs = require("fs/promises");
const { F_OK } = require("fs");
const inquirer = require("inquirer");
const config = require("getconfig");
const {
  createContract,
  createSetupTX,
  createMintTX,
  createReadScript
} = require("../util/codegen");

const fcl = require("@onflow/fcl");
fcl.config().put("accessNode.api", config.flowHTTPEndpoint);

async function generateCode(name, symbol) {
  const deploymentInfo = deploymentInfoFormatter(name);
  const go = await saveDeploymentInfo(deploymentInfo);
  if (!go) return;
  await createContract(name);
  await createSetupTX(name);
  await createMintTX(name);
  await createReadScript(name);
  return deploymentInfo;
}

function deploymentInfoFormatter(contractName) {
  return {
    networks: {
      emulator: config.flowGRPCEndpoint
    },
    accounts: {
      "emulator-account": {
        address: config.adminFlowAccount,
        keys: config.adminFlowPrivateKey
      }
    },
    contracts: {
      [contractName]: {
        source: `flow/cadence/contracts/${contractName}.cdc`,
        aliases: {
          emulator: config.adminFlowAccount
        }
      },
      FungibleToken: {
        source: "flow/cadence/contracts/FungibleToken.cdc",
        aliases: {
          emulator: config.fungibleTokenAddress
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
  // const { contracts } = deployInfo;
  // if (!contract) {
  //   throw new Error('required field "contract" not found');
  // }
  // const required = (arg) => {
  //   if (!deployInfo.contract.hasOwnProperty(arg)) {
  //     throw new Error(`required field "contract.${arg}" not found`);
  //   }
  // };
  // required("networks");
  // required("accounts");
  // required("contracts");
  // required("deployments");
  // TODO
  return true;
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
  generateCode,
  loadDeploymentInfo,
  saveDeploymentInfo
};

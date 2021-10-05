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

async function generateCode(name) {
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
      emulator: config.emulatorGRPCEndpoint,
      testnet: config.testnetGRPCEndpoint
    },
    accounts: {
      "emulator-account": {
        address: config.emulatorFlowAccount,
        keys: config.emulatorFlowPrivateKey
      },
      "testnet-account": {
        address: config.testnetFlowAccount,
        keys: config.testnetFlowPrivateKey
      }
    },
    contracts: {
      [contractName]: {
        source: `flow/cadence/contracts/${contractName}.cdc`,
        aliases: {
          emulator: config.emulatorFlowAccount,
          testnet: config.testnetFlowAccount
        }
      }
    },
    deployments: {
      emulator: {
        "emulator-account": [`${contractName}`]
      },
      testnet: {
        "testnet-account": [`${contractName}`]
      }
    }
  };
}

async function saveDeploymentInfo(info) {
  const exists = await fileExists(config.deploymentConfigFile);
  if (exists) {
    const overwrite = await confirmOverwrite(config.deploymentConfigFile);
    if (!overwrite) {
      return false;
    }
  }

  console.log(`Writing deployment info to ${config.deploymentConfigFile}`);
  const content = JSON.stringify(info, null, 2);
  await fs.writeFile(config.deploymentConfigFile, content, {
    encoding: "utf-8"
  });
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

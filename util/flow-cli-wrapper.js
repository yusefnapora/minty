const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function flowCliProjectDeployer() {
  const { stdout: out1, stderr: deployCoreContractsError } = await exec(
    "flow project deploy --network=emulator -f flow.json --update -o json"
  );

  if (deployCoreContractsError) {
    console.error(`error: ${deployCoreContractsError}`);
    return;
  }

  const { stdout: out2, stderr: deployCustomContractError } = await exec(
    "flow project deploy --network=emulator -f flow.json -f minty-deployment.json --update -o json"
  );

  if (deployCustomContractError) {
    console.error(`error: ${deployCustomContractError}`);
    return;
  }

  return JSON.parse(out2);
}

module.exports = { flowCliProjectDeployer };

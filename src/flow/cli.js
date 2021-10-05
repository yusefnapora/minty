const decode = require("@onflow/decode").decode
const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function handleError(error) {
  console.error(error);
  return;
}

function formatArgString(args) {
  const cadenceArgs = args.map((v) => v.type.asArgument(v.value))
  return JSON.stringify(cadenceArgs)
}

function formatConfigString(configs) {
  return configs.map((c) => `-f ${c}`).join(" ")
}

class FlowCliWrapper {

  constructor(network) {
    if (!network) network = "emulator";

    let configs = ["flow.json"]

    if (network === "testnet") {
      configs.push("flow.testnet.json")
    }

    this.network = network
    this.configs = configs
  }

  async deploy() {
    const configString = formatConfigString(this.configs)

    const { stdout: out, stderr: err } = await exec(
      `flow project deploy \
        --network=${this.network} \
        ${configString} \
        --update \
        -o json`,
        { cwd: process.env.PWD }
    );

    if (err) {
      handleError(err);
    }

    return JSON.parse(out);
  }

  async transaction(path, signer, args) {
    const argString = formatArgString(args)
    const configString = formatConfigString(this.configs)

    const { stdout: out, stderr: err } = await exec(
      `flow transactions send \
        --network=${this.network} \
        --signer ${signer} \
        ${configString} \
        -o json \
        --args-json '${argString}' \
        ${path}`,
        { cwd: process.env.PWD }
    );

    if (err) {
      handleError(err);
    }

    return JSON.parse(out);    
  }

  async script(path, args) {
    const argString = formatArgString(args)
    const configString = formatConfigString(this.configs)

    const { stdout: out, stderr: err } = await exec(
      `flow scripts execute \
        --network=${this.network} \
        ${configString} \
        -o json \
        --args-json '${argString}' \
        ${path}`,
        { cwd: process.env.PWD }
    );

    if (err) {
      handleError(err);
    }

    const json = JSON.parse(out);

    return await decode(json)
  }
}

module.exports = FlowCliWrapper;

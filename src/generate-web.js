const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");
const getConfig = require("./config");

async function isExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(filePath, data) {
  try {
    const dirname = path.dirname(filePath);
    const exist = await isExists(dirname);
    if (!exist) {
      await fs.mkdir(dirname, { recursive: true });
    }

    await fs.writeFile(filePath, data, "utf8");
  } catch (err) {
    throw new Error(err);
  }
}

async function generateWebAssets(dir, name) {
  const config = getConfig();
  const flowConfig = require(path.resolve(__dirname, `../${dir}/flow.json`));

  await fs.copy(
    path.resolve(__dirname, "templates/web"),
    path.resolve(dir, "web")
  );

  const webEnv = await fs.readFile(
    path.resolve(__dirname, "templates/.env.web"),
    "utf8"
  );

  const webLocalEnvTemplate = Handlebars.compile(webEnv);
  const webTestnetEnvTemplate = Handlebars.compile(webEnv);

  const webLocalEnv = webLocalEnvTemplate({
    dir,
    chainEnv: "emulator",
    faucetAddress: config.faucetAddress,
    accessAPI: config.emulatorAccessAPI,
    walletDiscovery: config.emulatorWalletDiscovery,
    nftAddress: config.emualtorNFTAddress,
    projectContractAddress: flowConfig.contracts[name].aliases.emulator
  });

  const webTestnetEnv = webTestnetEnvTemplate({
    dir,
    chainEnv: "emulator",
    faucetAddress: config.faucetAddress,
    accessAPI: config.testnetAccessAPI,
    walletDiscovery: config.testnetWalletDiscovery,
    nftAddress: config.testnetNFTAddress,
    projectContractAddress: flowConfig.contracts[name].aliases.testnet
  });

  await writeFile(
    path.resolve(__dirname, `../${dir}/web/.env.local`),
    webLocalEnv
  );
  await writeFile(
    path.resolve(__dirname, `../${dir}/web/.env.testnet`),
    webTestnetEnv
  );
}

module.exports = generateWebAssets;

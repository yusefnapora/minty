const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");
const generateWebAssets = require("./generate-web");

async function generateProject(projectName, contractName) {
  await createScaffold(projectName);

  await createContract(projectName, contractName);
  await createSetupTransaction(projectName, contractName);
  await createMintTransaction(projectName, contractName);
  await createReadScript(projectName, contractName);

  await createFlowConfig(projectName, contractName);
  await createFlowTestnetConfig(projectName, contractName);
  await createFlowMainnetConfig(projectName, contractName);

  await createWebAssets(projectName, contractName);
  await createReadme(projectName, contractName);
}

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

async function createScaffold(dir) {
  await fs.copy(
    path.resolve(__dirname, "templates/assets"),
    path.resolve(dir, "assets")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/ipfs-data"),
    path.resolve(dir, "ipfs-data")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/mint-data"),
    path.resolve(dir, "mint-data")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/cadence/contracts/NonFungibleToken.cdc"),
    path.resolve(dir, "cadence/contracts/NonFungibleToken.cdc")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/minty.config.js"),
    path.resolve(dir, "minty.config.js")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/.env.cli"),
    path.resolve(dir, ".env")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/nfts.csv"),
    path.resolve(dir, "nfts.csv")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/docker-compose.yml"),
    path.resolve(dir, "docker-compose.yml")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/cleanup.sh"),
    path.resolve(dir, "cleanup.sh")
  );

  await fs.copy(
    path.resolve(__dirname, "templates/.gitignore"),
    path.resolve(dir, ".gitignore")
  );
}

async function createContract(dir, name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/cadence/contracts/NFT.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, `cadence/contracts/${name}.cdc`), result);
}

async function createSetupTransaction(dir, name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/cadence/transactions/setup_account.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await writeFile(
    path.resolve(dir, "cadence/transactions/setup_account.cdc"),
    result
  );
}

async function createMintTransaction(dir, name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/cadence/transactions/mint_nft.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, "cadence/transactions/mint.cdc"), result);
}

async function createReadScript(dir, name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/cadence/scripts/get_nft.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, `cadence/scripts/get_nft.cdc`), result);
}

async function createFlowConfig(dir, name) {
  const configTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/flow.json"),
    "utf8"
  );

  const template = Handlebars.compile(configTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, "flow.json"), result);
}

async function createFlowTestnetConfig(dir, name) {
  const configTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/flow.testnet.json"),
    "utf8"
  );

  const template = Handlebars.compile(configTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, "flow.testnet.json"), result);
}

async function createFlowMainnetConfig(dir, name) {
  const configTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/flow.mainnet.json"),
    "utf8"
  );

  const template = Handlebars.compile(configTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, "flow.mainnet.json"), result);
}

async function createReadme(dir, name) {
  const readmeTemplate = await fs.readFile(
    path.resolve(__dirname, "templates/README.md"),
    "utf8"
  );

  const template = Handlebars.compile(readmeTemplate);

  const result = template({ name });

  await writeFile(path.resolve(dir, "README.md"), result);
}

async function createWebAssets(dir, name) {
  await generateWebAssets(dir, name);
}

module.exports = generateProject;

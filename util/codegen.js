const fs = require("fs/promises");
const path = require("path");
const Handlebars = require("handlebars");

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

async function createContract(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/templates/cadence/NFTTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await writeFile(
    path.resolve(__dirname, `../flow/cadence/contracts/${name}.cdc`),
    result
  );
}

async function createSetupTX(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/templates/cadence/SetupTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await writeFile(
    path.resolve(__dirname, `../flow/cadence/transactions/setup_account.cdc`),
    result
  );
}

async function createMintTX(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/templates/cadence/MintTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await fs.writeFile(
    path.resolve(__dirname, `../flow/cadence/transactions/mint.cdc`),
    result
  );
}

async function createReadScript(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/templates/cadence/GetTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await fs.writeFile(
    path.resolve(__dirname, `../flow/cadence/scripts/get_nft.cdc`),
    result
  );
}

module.exports = {
  createReadScript,
  createContract,
  createSetupTX,
  createMintTX
};

const fs = require("fs/promises");
const path = require("path");
const Handlebars = require("handlebars");

async function createContract(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/cadence/templates/NFTTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await fs.writeFile(
    path.resolve(__dirname, `../flow/cadence/contracts/${name}.cdc`),
    result,
    "utf8"
  );
}

async function createSetupTX(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/cadence/templates/SetupTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await fs.writeFile(
    path.resolve(__dirname, `../flow/cadence/transactions/setup_account.cdc`),
    result,
    "utf8"
  );
}

async function createMintTX(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/cadence/templates/MintTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await fs.writeFile(
    path.resolve(__dirname, `../flow/cadence/transactions/mint.cdc`),
    result,
    "utf8"
  );
}

module.exports = {
  createContract,
  createSetupTX,
  createMintTX
};

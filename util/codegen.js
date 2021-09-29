const fs = require("fs/promises");
const path = require("path");
const YAML = require("yaml");
const Handlebars = require("handlebars");

module.exports = async function createContract(name) {
  const nftTemplate = await fs.readFile(
    path.resolve(__dirname, "../flow/cadence/NFTTemplate.cdc"),
    "utf8"
  );

  const template = Handlebars.compile(nftTemplate);

  const result = template({ name });

  await fs.writeFile(
    path.resolve(__dirname, `../flow/cadence/contracts/${name}.cdc`),
    result,
    "utf8"
  );
};

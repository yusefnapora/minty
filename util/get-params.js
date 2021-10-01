const path = require("path");
const fs = require("fs/promises");
const YAML = require("yaml");

async function getParams() {
  const paramsFile = await fs.readFile(
    path.resolve(__dirname, "../params.yml"),
    "utf8"
  );

  const params = YAML.parse(paramsFile);
  return params;
}

module.exports = getParams;

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
  await fs.copy(path.resolve(__dirname, "templates/web"), dir);

  const packageJSON = await fs.readFile(
    path.resolve(__dirname, `templates/web/package.json`),
    "utf8"
  );

  const packageJSONNameApplied = Handlebars.compile(packageJSON);

  await writeFile(
    path.resolve(dir, `package.json`),
    packageJSONNameApplied({ name })
  );

  const getNFTScript = await fs.readFile(
    path.resolve(__dirname, "templates/web/flow/get_nft.js"),
    "utf8"
  );

  const getNFTScriptNameApplied = Handlebars.compile(getNFTScript);

  await writeFile(
    path.resolve(dir, `flow/get_nft.js`),
    getNFTScriptNameApplied({ name })
  );
}

module.exports = generateWebAssets;

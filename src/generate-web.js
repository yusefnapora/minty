const fs = require("fs-extra");
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

async function generateWebAssets(dir, name) {
  await fs.copy(path.resolve(__dirname, "templates/web"), dir);

  const packageJSON = await fs.readFile(
    path.resolve(__dirname, "templates/web/package.json"),
    "utf8"
  );

  const packageJSONTemplate = Handlebars.compile(packageJSON);

  await writeFile(
    path.resolve(dir, `package.json`),
    packageJSONTemplate({ dir })
  );

  const replaceImportsScript = await fs.readFile(
    path.resolve(__dirname, "templates/web/src/flow/replace-imports.js"),
    "utf8"
  );

  const replaceImportsScriptTemplate = Handlebars.compile(replaceImportsScript);

  await writeFile(
    path.resolve(dir, `src/flow/replace-imports.js`),
    replaceImportsScriptTemplate({ name })
  );
}

module.exports = generateWebAssets;

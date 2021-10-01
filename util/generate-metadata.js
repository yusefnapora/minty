const parse = require("csv-parse/lib/sync");
const fs = require("fs");
const path = require("path");
const config = require("getconfig");

const generateMetaData = async (csvPath) => {
  const nftCSV = fs.readFileSync(path.resolve(__dirname, csvPath));
  // Parse the CSV content
  const records = parse(nftCSV);

  const fields = records[0];
  const data = records.slice(1);

  const metadata = data.map((values) => {
    const record = {};
    values.forEach((value, index) => {
      record[fields[index]] = value;
    });
    if (!record.asset) {
      throw new Error(
        "Error generating metadata, must supply 'asset' property"
      );
    }

    try {
      fs.statSync(
        path.resolve(__dirname, `${config.nftAssetPath}/${record.asset}`)
      );
    } catch (e) {
      throw new Error(
        `Generating metadata failed, asset does not exist for ${JSON.stringify(
          record,
          null,
          2
        )}`
      );
    }

    return record;
  });

  return metadata;
};

module.exports = generateMetaData;

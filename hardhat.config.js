require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("deploy-minty", "Deploys a new instance of the Minty contract with the specified name and symbol")
    .addOptionalParam("name", "The full name of the token contract", "Minty")
    .addOptionalParam("symbol", "A short symbol for the token type", "MINT")
    .setAction(async taskArgs => {
      const {name, symbol} = taskArgs;
      console.log(`deploying contract for ${name} (${symbol})...`);
      const Minty = await ethers.getContractFactory("Minty");
      const minty = await Minty.deploy(name, symbol);

      await minty.deployed();
      console.log(`deployed ${name} (${symbol}) to ${minty.address}`);

      // TODO: write the contract address, token name & symbol to a config file for later use
    });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.3",
};


/**
 * hardhatRuntime returns an instance of the Hardhat runtime environment. Using this instead of calling
 * `require('hardhat')` gives us a place to customize the environment before it loads.
 * @returns {HardhatRuntimeEnvironment} an instance of the Hardhat Runtime Environment.
 */
function hardhatRuntime() {
    return require('hardhat')
}

module.exports = {
    hardhatRuntime,
}

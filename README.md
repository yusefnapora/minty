# minty

Minty is an example of how to _mint_ non-fungible tokens (NFSs) while storing the
associated data on IPFS. You can also use Minty to pin your data on an IPFS pinning service such as Pinata.

## Usage

Run `minty help` to see full usage instructions or `minty help <command>` for help on a specific command: 

```shell
minty help mint

> create a new NFT from an image file
> 
> Options:
>   -n, --name <name>         The name of the NFT
>   -d, --description <desc>  A description of the NFT
>   -o, --owner <address>     The ethereum address that should own the NFT.If not provided,
>                             defaults to the first signing address.
>   -h, --help                display help for command
```

## Setup 

To install and run Minty, you must have NPM installed. Windows is not currently supported.

1. Clone this repository and move into the `minty` directory:

    ```shell
    git clone https://github.com/yusefnapora/minty
    cd minty
    ```

1. Install the NPM dependencies:

    ```shell
    npm install
    ```

1. Add the `minty` command to your `$PATH`. This makes it easier to run Minty from anywhere on your computer:

    ```
    npm link
    ```

1. Initialize a local IPFS node

    ```
    npx ipfs init
    ```

1. Run the `start-local-environment.sh` script to start the local Ethereum testnet and IPFS daemon:

    ```shell
    ./start-local-environment.sh

    > Compiling smart contract
    > Compiling 16 files with 0.7.3
    > ...
    ```

    This command continues to run. All further commands must be entered in another terminal window.

## Deploy the contract

Before running any of the other `minty` commands, you'll need to deploy an instance of the
smart contract:

```shell
minty deploy

> deploying contract for token Julep (JLP) to network "localhost"...
> deployed contract for token Julep (JLP) to 0x5FbDB2315678afecb367f032d93F642f64180aa3 (network: localhost)
> Writing deployment info to minty-deployment.json
```

The terminal window running the `./start-local-environment.sh` will output something like:

```shell
> [eth] eth_chainId
> [eth] eth_getTransactionByHash
> [eth] eth_blockNumber
> eth_chainId (2)Id
> eth_getTransactionReceipt
```

This deploys to the network configured in [`hardhat.config.js`](./hardhat.config.js), which is set to the `localhost` network by default. If you get an error about not being able to reach the network, make sure to run the local development network with `./start-local-environment.sh`.

When the contract is deployed, the address and other information about the deployment is written to `minty-deployment.json`. This file must be present for subsequent commands to work.

To deploy to an ethereum testnet, see the [Hardhat configuration docs](https://hardhat.org/config/) to learn how to configure a JSON-RPC node. Once you've added a new network to the Hardhat config, you can use it by setting the `HARDHAT_NETWORK` environment variable to the name of the new network when you run `minty` commands. Alternatively, you can change the `defaultNetwork` in `hardhat.config.js` to always prefer the new network.

Deploying this contract to the Ethereum mainnet is a bad idea since the contract itself lacks any access control. See the [Open Zeppelin article](https://docs.openzeppelin.com/contracts/3.x/access-control) about what access control is, and why it's important to have.

## Configuration

Configuration are stored in [`./config/default.js`](./config/default.js).

The `start-local-devnet.sh` script will try to run a local IPFS daemon, which Minty will connect to on its default port. If you've already installed IPFS and configured it to use a non-standard API port, you may need to change the `ipfsApiUrl` field to set the correct API address.

The `pinningService` configuration option is used by the `minty pin` command to persist
IPFS data to a remote pinning service.

The default configuration is setup to pin data to [Pinata](https://pinata.cloud), and it expects a Pinata JWT access token to be set to the `PINATA_API_TOKEN` environment variable.

If you don't have an API token, either get a free one or configure a different pinning service. With no pinning service, everything apart from the `minty pin` command should still work.

### Mint a new NFT

Once you have the local Ethereum network and IPFS daemon running, minting an NFT is incredibly simple. Just specify what you want to _tokenize_, the name of the NFT, and a description to tell users what the NFT is for:

```shell
minty mint ~/flight-to-the-moon.txt --name "Moon Flight #1" --description "This ticket serves as proof-of-ownership of a first-class seat on a flight to the moon."

> 🌿 Minted a new NFT:
> Token ID:              1
> Metadata URI:          ipfs://Qma4RRDu9Q5ZXb4F6HSPAHXeyinYYFuBMTrk7HbHrsbcN9/metadata.json
> Metadata Gateway URL:  http://localhost:8080/ipfs/Qma4RRDu9Q5ZXb4F6HSPAHXeyinYYFuBMTrk7HbHrsbcN9/metadata.json
> Asset URI:             ipfs://QmbwYvCrjnv9nKqagwYoniNzppf96za7BnateWD18mQnHX/flight-to-the-moon.txt
> Asset Gateway URL:     http://localhost:8080/ipfs/QmbwYvCrjnv9nKqagwYoniNzppf96za7BnateWD18mQnHX/flight-to-the-moon.txt
> NFT Metadata:
> {
>   "name": "Moon Flight #1",
>   "description": "This ticket serves are proof-of-ownership of a first-class seat on a flight to the moon.",
>   "image": "ipfs://QmbwYvCrjnv9nKqagwYoniNzppf96za7BnateWD18mQnHX/flight-to-the-moon.txt"
> }
```

### Show details of an existing NFT

You can view the details of each individual NFT by calling `show` along with the ID of the NFT:

```shell
minty show 1

> Token ID:              1
> Owner Address:         0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
> Metadata URI:          ipfs://Qma4RRDu9Q5ZXb4F6HSPAHXeyinYYFuBMTrk7HbHrsbcN9/metadata.json
> ...
```

### Pin IPFS assets for an NFT

The assets for new tokens are stored in a local IPFS repository which is only _online_ while a local IPFS daemon is running. The `start-local-environment.sh` script starts a local daemon for you if you aren't already running and IPFS daemon. If you are, then the script just uses the daemon you already have.

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service](https://ipfs.github.io/pinning-services-api-spec) like [Pinata](https://pinata.cloud/) store a copy of your IPFS data on their IPFS nodes.

To pin the data for token, use the `minty pin` command:

```shell
minty pin 1

> Pinning asset data (ipfs://QmUAACALRufqXnGHM1QCSr5JA3b54N5QBKD73EXx6pws2f/ipfs-logo.png) for token id 1....
> Pinning metadata (ipfs://QmR6YQJX9woK2SzmzFJ1T4q1bMinbQrWaSQdcxcJmgKuDY/metadata.json) for token id 1...
> 🌿 Pinned all data for token id 1
```

The `pin` command looks for a JWT access token from [Pinata](https://pinata.cloud) in the `PINATA_API_TOKEN` environment variable. Once you've obtained a token from Pinata, you can set it with a command like:

```shell
export PINATA_API_TOKEN="paste token here"
```

If you'd prefer to use a different pinning service, you can edit the configuration in `config/default.js`.
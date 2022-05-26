# minty

Minty is an example of how to _mint_ non-fungible tokens (NFTs) while storing the
associated data on IPFS. You can also use Minty to pin your data on an IPFS pinning service such as [nft.storage](https://nft.storage) and [Pinata](https://pinata.cloud).

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

The `./start-local-environment.sh` script will try to run a local IPFS daemon, which Minty will connect to on its default port. If you've already installed IPFS and configured it to use a non-standard API port, you may need to change the `ipfsApiUrl` field to set the correct API address.

The `pinningService` configuration option is used by the `minty pin` command to persist IPFS data to a remote pinning service.

The default `pinningService` configuration reads in the name, API endpoint and API key from environment variables, to make it a little harder to accidentally check an access token into version control.

You can define these values in a [dotenv file](https://www.npmjs.com/package/dotenv) so you don't need to set them in each shell session. Just create a file called `.env` inside the `config` directory or in the root directory of the repository, and make it look similar to this:

```shell
PINNING_SERVICE_KEY="Paste your nft.storage JWT token inside the quotes!"
PINNING_SERVICE_NAME="nft.storage"
PINNING_SERVICE_ENDPOINT="https://nft.storage/api"
```

The `.env` file will be ignored by git, so you don't need to worry about checking it in by accident.

The snippet above will configure minty to use [nft.storage](https://nft.storage), a free service offered by Protocol Labs for storing public NFT data. You can find an example `.env` file for **nft.storage** at [`config/nft.storage.env.example`](./config/nft.storage.env.example).

Any service that implements the [IPFS Remote Pinning API](https://ipfs.github.io/pinning-services-api-spec) can be used with Minty. To use [Pinata](https://pinata.cloud), check out the example at [`config/pinata.env.example`](./config/pinata.env.example).

With no pinning service configured, everything apart from the `minty pin` command should still work.

### Mint a new NFT

Once you have the local Ethereum network and IPFS daemon running, minting an NFT is incredibly simple. Just specify what you want to _tokenize_, the name of the NFT, and a description to tell users what the NFT is for:

```shell
minty mint ~/ticket.txt --name "Moon Flight #1" --description "This ticket serves as proof-of-ownership of a first-class seat on a flight to the moon."

> 🌿 Minted a new NFT:
> Token ID:              1
> Metadata URI:          ipfs://bafybeic3ui4dj5dzsvqeiqbxjgg3fjmfmiinb3iyd2trixj2voe4jtefgq/metadata.json
> Metadata Gateway URL:  http://localhost:8080/ipfs/bafybeic3ui4dj5dzsvqeiqbxjgg3fjmfmiinb3iyd2trixj2voe4jtefgq/metadata.json
> Asset URI:             ipfs://bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq/ticket.txt
> Asset Gateway URL:     http://localhost:8080/ipfs/bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq/ticket.txt
> NFT Metadata:
> {
>   "name": "Moon Flight #1",
>   "description": "This ticket serves as proof-of-ownership of a first-class seat on a flight to the moon.",
>   "image": "ipfs://bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq/ticket.txt"
> }
```

### Show details of an existing NFT

You can view the details of each individual NFT by calling `show` along with the ID of the NFT:

```shell
minty show 1

> Token ID:              1
> Owner Address:         0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
> Metadata URI:          ipfs://bafybeic3ui4dj5dzsvqeiqbxjgg3fjmfmiinb3iyd2trixj2voe4jtefgq/metadata.json
> ...
```

### Pin IPFS assets for an NFT

The assets for new tokens are stored in a local IPFS repository which is only _online_ while a local IPFS daemon is running. The `start-local-environment.sh` script starts a local daemon for you if you aren't already running and IPFS daemon. If you are, then the script just uses the daemon you already have.

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service](https://ipfs.github.io/pinning-services-api-spec) like [Pinata](https://pinata.cloud/) or [nft.storage](https://nft.storage) store a copy of your IPFS data on their IPFS nodes.

To pin the data for token, use the `minty pin` command:

```shell
minty pin 1

> Pinning asset data (ipfs://bafybeihhii26gwp4w7b7w7d57nuuqeexau4pnnhrmckikaukjuei2dl3fq/ticket.txt) for token id 1....
> Pinning metadata (ipfs://bafybeic3ui4dj5dzsvqeiqbxjgg3fjmfmiinb3iyd2trixj2voe4jtefgq/metadata.json) for token id 1...
> 🌿 Pinned all data for token id 1
```

The `pin` command looks for some configuration info to connect to the remote pinning service. See the [Configuration section](#configuration) above for details.

### Verify Contract for EtherScan 

You can now verify your NFT contract on etherscan. Run this command line, but make sure to replace the {CONTRACT_ADDRESS} with your deployed contract address. Also, please replcae the "CONTRACT_NAME" and "CONTRACT_TICKER" with your contract name and ticker symbol. 

```shell
npx hardhat verify --network rinkeby {CONTRACT_ADDRESS}  "CONTRACT_NAME" "CONTRACT_TICKER"

Successfully submitted source code for contract
contracts/Minty.sol:Minty at 0xcC17B83373fDb75C5e1F6F074437249C53A026F5
for verification on the block explorer. Waiting for verification result...

Successfully verified contract Minty on Etherscan.
https://rinkeby.etherscan.io/address/0xcC17B83373fDb75C5e1F6F074437249C53A026F5#code

```
# minty

> A minimal NFT minting platform with IPFS integration.

`minty` is an example of how to "mint" Non-Fungible Tokens, or NFTs, while storing the
data associated with each token on IPFS.

To persist the IPFS data and make it highly available,
`minty` uses the [IPFS Pinning Service API][pinning-service-api] to request that 
a remote pinning service keep a copy online.

See [the companion tutorial][minty-tutorial] for more details.

## Set up

1. Clone this repository and enter it:

    ```shell
    git clone https://github.com/yusefnapora/minty
    cd minty
    ```

1. Install NPM dependencies:

    ```shell
    npm install
    ```

1. Add the `minty` command to your `$PATH`:

    ```
    npm link
    ```

1. Run the `start-local-environment.sh` script to run a local Ethereum devnet and start IPFS:

    ```shell
    ./start-local-environment.sh

    > Compiling smart contract
    > Compiling 16 files with 0.7.3
    > ...
    ```

    This command continues to run. All further commands need to be entered in another terminal window.

1. Deploy the smart contract:

    ```shell
    minty deploy

    > ...
    > [ipfs] Daemon is ready
    ```

The contract address and other info is written to `minty-deployment.json`. This file will be used by future `minty` commands to find the right contract.

## Usage

Run `minty help` to see full usage instructions, and `minty help <command>` to see help for a specific command: 

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

### Configuration

Configuration are stored in [`./config/default.js`](./config/default.js).

The `start-local-devnet.sh` script will try to run a local IPFS daemon, which Minty will connect to on its default port. If you've already installed IPFS and configured it to use a non-standard API port, you may need to change the `ipfsApiUrl` field to set the correct API address.

The `pinningService` configuration option is used by the `minty pin` command to persist
IPFS data to a remote pinning service.

The default configuration is setup to pin data to [Pinata](https://pinata.cloud), and it expects a Pinata JWT access token to be set to the `PINATA_API_TOKEN` environment variable.

If you don't have an API token, either get a free one or configure a different pinning service. With no pinning service, everything apart from the `minty pin` command should still work.

### Deploy the smart contract

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

### Mint a new NFT

Once you have the local Ethereum network and IPFS daemon running, minting an NFT it increaibly simple. Just specify what you want to _tokenize_, the name of the NFT, and a description to tell users what the NFT is for:

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

You can view the details of each individual NFL by calling `show` along with the ID of the NFT:

```shell
minty show 1

> Token ID:              1
> Owner Address:         0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
> Metadata URI:          ipfs://Qma4RRDu9Q5ZXb4F6HSPAHXeyinYYFuBMTrk7HbHrsbcN9/metadata.json
> ...
```

### Pin IPFS assets for an NFT

The assets for new tokens are stored in a local IPFS repository which is only _online_ while a local IPFS daemon is running. The `start-local-environment.sh` script starts a local daemon for you if you aren't already running and IPFS daemon. If you are, then the script just uses the daemon you already have.

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service][https://ipfs.github.io/pinning-services-api-spec] like [Pinata][https://pinata.cloud/] store a copy of your IPFS data on their IPFS nodes.



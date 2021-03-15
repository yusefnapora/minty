# minty
> A minimal NFT minting platform with IPFS integration.

`minty` is an example of how to "mint" Non-Fungible Tokens, or NFTs, while storing the
data associated with each token on IPFS.

To persist the IPFS data and make it highly available,
`minty` uses the [IPFS Pinning Service API][pinning-service-api] to request that 
a remote pinning service keep a copy online.

See [the companion tutorial][minty-tutorial] for more details.

## Install / Setup

Clone this repository and enter it:

```shell
git clone https://github.com/yusefnapora/minty
cd minty
```

Install NPM dependencies and add the `minty` command to your path:

```shell
npm install
npm link
```

Run the `start-local-environment.sh` script to run a local Ethereum devnet and start IPFS:
```shell
./start-local-environment.sh
```

With the local environment scrip running in another terminal, deploy the smart contract:
```shell
minty deploy
```

When the deployment is done, the contract address and other info is written to
`minty-deployment.json`. This file will be used by future `minty` commands to find
the right contract.

## Usage

Currently the `minty` command must be run from inside the root directory of this repository, since it will try to
read some configuration files at launch.

Run `minty --help` to see usage instructions.

### Configuration

Some configuration is stored in [`./config/default.js`](./config/default.js).

The `start-local-devnet.sh` script will try to run a local IPFS daemon, which Minty will connect to on its default port.
If you've already installed IPFS and configured it to use a non-standard API port, you may need to
change the `ipfsApiUrl` field to set the correct API address.

The `pinningService` configuration option is used by the `minty pin` command to persist
IPFS data to a remote pinning service.

The default configuration is setup to pin data to [Pinata](https://pinata.cloud), and it expects a Pinata JWT
access token to be set to the `PINATA_API_TOKEN` environment variable.

If you don't have an API token, either get a free one or configure a different pinning service. With no pinning service,
everything apart from the `minty pin` command should still work.

### Deploy the smart contract

Before running any of the other `minty` commands, you'll need to deploy an instance of the
smart contract:

```shell
minty deploy
```

This will deploy to the network configured in [`hardhat.config.js`](./hardhat.config.js), which by default
is the `localhost` network. If you get an error about not being able to reach the network, make sure to
run the local development network with `./start-devnet.sh`.

When the contract is deployed, the address and other information about the deployment is written to a JSON file,
by default called `minty-deployment.json`. This file must be present for subsequent commands to work.

To deploy to an ethereum testnet, see the [Hardhat configuration docs](https://hardhat.org/config/) to learn
how to configure a JSON-RPC node. Once you've added a new network to the Hardhat config, you can use it by 
setting the `HARDHAT_NETWORK` environment variable to the name of the new network when you run `minty` commands. 
Alternatively, you can change the `defaultNetwork` in `hardhat.config.js` to always prefer the new network.

In theory, you could deploy to mainnet as well, but that would probably be a bad idea, as the Minty smart
contract lacks important things like [access control](https://docs.openzeppelin.com/contracts/3.x/access-control)
and other "table stakes" for a production contract.

### Mint a new NFT

```shell
minty mint ~/pics/my-nice-pic.jpeg --name "A very nice picture" --description "Some long description"
```

```
Minted new NFT:  {
  tokenId: '1',
  metadata: {
    name: 'A very nice picture',
    description: 'Some long description',
    image: 'ipfs://QmSH4rRhdfNRsisZR5kbK7zAqRb14cpWADRBP3tEjBf3mQ'
  },
  assetURI: 'ipfs://QmSH4rRhdfNRsisZR5kbK7zAqRb14cpWADRBP3tEjBf3mQ',
  metadataURI: 'ipfs://QmUJibEFFTNEbvof9AroJK8m4HBUz427FTX8ejW2FoZpzn'
}
```

### Show details of an existing NFT

```shell
minty show 1
```

```
{
  tokenId: '1',
  metadata: {
    name: 'A very nice picture',
    description: 'Some long description',
    image: 'ipfs://QmSH4rRhdfNRsisZR5kbK7zAqRb14cpWADRBP3tEjBf3mQ'
  },
  metadataURI: 'ipfs://QmUJibEFFTNEbvof9AroJK8m4HBUz427FTX8ejW2FoZpzn',
  ownerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
}
```

### Pin IPFS assets for an NFT

The assets for new tokens are stored in a local IPFS repository, which is only "online" temporarily while
running `minty` commands.

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service][pinning-service-api] like [Pinata](https://pinata.cloud) store a copy of your IPFS data on their IPFS nodes.

See the [configuration section](#configuration) above for details on setting up the pinning service credentials.

```shell
minty pin 1
```

```
Pinning asset data (ipfs://QmSH4rRhdfNRsisZR5kbK7zAqRb14cpWADRBP3tEjBf3mQ) for token id 1....
Pinning metadata (ipfs://QmUJibEFFTNEbvof9AroJK8m4HBUz427FTX8ejW2FoZpzn) for token id 1...
Pinned all data for token id 1
```

Instead of or in addition to pinning data remotely, you can make the data available when `minty` is not running by installing `js-ipfs` globally, and running the IPFS daemon:

```shell
npm install -g ipfs
js-ipfs daemon
```

This will use the same local repository as Minty, and will provide your data to the IPFS network as long as your computer is online.

[pinning-service-api]: https://ipfs.github.io/pinning-services-api-spec/

<!-- TODO: add tutorial link -->
[minty-tutorial]: http://example.com/fixme

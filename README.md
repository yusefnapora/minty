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

Run a local ethereum devnet:
```shell
./start-devnet.sh
```

With the devnet running in another terminal, deploy the smart contract:
```shell
minty deploy
```

When the deployment is done, the contract address and other info is written to
`minty-deployment.json`. This file will be used by future `minty` commands to find
the right contract.

## Usage

Currently the `minty` command must be run from inside the root directory of this repository, since it will try to
read some configuration files at launch.

### Configuration

Some configuration is stored in [`./config/default.js`](./config/default.js).

The most important bit is the `pinningService` configuration, which is used by the `minty pin` command to persist
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
how to configure a JSON-RPC node. To use a different network, either change the `defaultNetwork` field in 
`hardhat.config.js`, or set the `HARDHAT_NETWORK` environment variable to the name of a network that's been
defined in the hardhat config.

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
  assetCid: CID(QmSH4rRhdfNRsisZR5kbK7zAqRb14cpWADRBP3tEjBf3mQ),
  metadataCid: CID(QmUJibEFFTNEbvof9AroJK8m4HBUz427FTX8ejW2FoZpzn)
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

You can make the data available when `minty` is not running by installing `js-ipfs` globally, and running the IPFS daemon:

```shell
npm install -g ipfs
js-ipfs daemon
```

This will use the same local repository as Minty, and will provide your data to the IPFS network as long as your computer is online.

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service][pinning-service-api] like [Pinata](https://pinata.cloud) store a copy of your IPFS data on their IPFS nodes.

See the [configuration section](#configuration) above for details on setting up the pinning service credentials.

```shell
minty pin 1
```

```
Pinning asset data (ipfs://QmSH4rRhdfNRsisZR5kbK7zAqRb14cpWADRBP3tEjBf3mQ) for token id 6....
Pinning metadata (ipfs://QmUJibEFFTNEbvof9AroJK8m4HBUz427FTX8ejW2FoZpzn) for token id 6...
Pinned all data for token id 6
```

[pinning-service-api]: https://ipfs.github.io/pinning-services-api-spec/

<!-- TODO: add tutorial link -->
[minty-tutorial]: http://example.com/fixme

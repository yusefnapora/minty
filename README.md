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

**Note**: all of this cli usage stuff is all subject to change for the next few days. 

### API token for pinning service

The default config currently assumes that you'll be pinning to Pinata, and that you
have a Pinata JWT token in an environment variable named `PINATA_API_TOKEN`.

If you don't have a key, edit the default config in `src/minty/index.js` and remove the
pinata entry from the `pinningServices` array.

### Mint a new NFT

```shell
minty create-nft ~/pics/my-nice-pic.jpeg --name "A very nice picture" --description "Some long description"
```

[pinning-service-api]: https://ipfs.github.io/pinning-services-api-spec/

<!-- TODO: add tutorial link -->
[minty-tutorial]: http://example.com/fixme

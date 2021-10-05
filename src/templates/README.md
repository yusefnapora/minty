# {{name}}

## Start the emulator

```sh
docker-compose up -d
```

## Deploy your contract

```sh
minty deploy
```

## Mint your NFTs

```sh
minty mint
```

## Get an NFT

```sh
minty show 0
```

## Pin an NFT

First set up your config:

```sh
cp .env.example .env

# Replace PINNING_SERVICE_KEY= with your nft.storage API key
```

```sh
minty pin 0
```

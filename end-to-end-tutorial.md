---
title: End-to-end tutorial
description: Go from nothing, to having an NFT pinned on Pinata in just a few minutes.
date: 2021-03-17
---

# End-to-end tutorial

## Prerequisites

Install and run Minty, you must have NPM installed. Windows is not currently supported.

## Download and install Minty

Installation of Minty is fairly simple. Just download the GitHub repository, install the NPM dependencies, and start the local testnet environment. 

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

    ```shell
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

This deploys to the network configured in [`hardhat.config.js`](./hardhat.config.js), which is set to the `localhost` network by default. If you get an error about not being able to reach the network, make sure to run the local development network with `./start-local-environment.sh`.

When the contract is deployed, the address and other information about the deployment is written to `minty-deployment.json`. This file must be present for subsequent commands to work.

To deploy to an ethereum testnet, see the [Hardhat configuration docs](https://hardhat.org/config/) to learn how to configure a JSON-RPC node. Once you've added a new network to the Hardhat config, you can use it by setting the `HARDHAT_NETWORK` environment variable to the name of the new network when you run `minty` commands. Alternatively, you can change the `defaultNetwork` in `hardhat.config.js` to always prefer the new network.

Deploying this contract to the Ethereum mainnet is a bad idea since the contract itself lacks any access control. See the [Open Zeppelin article](https://docs.openzeppelin.com/contracts/3.x/access-control) about what access control is, and why it's important to have.

## Mint an NFT

Once you have the local Ethereum network and IPFS daemon running, minting an NFT it increaibly simple. Just specify what you want to _tokenize_, the name of the NFT, and a description to tell users what the NFT is for.

### Create something to mint

First, let's create something to mint. NFTs have a huge range of use-cases, so we're going to create a ticket for an flight to the moon.

1. Create a file called `flight-to-the-moon.txt`:

    ```shell
    touch ~/flight-to-the-moon.txt
    ```

1. Open the file and enter some flight information:

    ```
    THE INTERPLANETARY TRAVEL COMPANY
    ---------------------------------
    Departing: Cape Canaveral, Earth
    Arriving: Base 314, The Moon
    Boarding time: 17:30 UTC
    Seat number: 1A
    Baggage allowance: 5kg 
    ```

1. Save and close the file.

### Mint the file

Now that we've got our ticket, we can mint it.

1. Call the `mint` command and supply the file we want to mint, the name of our NFT, and a description:

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

1. That it!

Great! You've created your NFT, but it's only available to other people as long as you have you IPFS node running! If you shutdown your computer or you lose your internet connection, then no one else will be able to view your NFT! To get around this issue you should pin it to a pinning service. 

## Pin your NFT

To make the data highly available without needing to run a local IPFS daemon 24/7, you can request that a [Remote Pinning Service](https://ipfs.github.io/pinning-services-api-spec) like [Pinata](https://pinata.cloud/) store a copy of your IPFS data on their IPFS nodes. You can link Pinata and Minty together by signing up to Pinata, getting an API key, and adding the key to Minty's configuration file.

### Sign up to Pinata

1. Head over to [pinata.cloud](https://pinata.cloud/).
1. Click **Sign up** and use your email address to create an account.

Pinata gives each user 1GB of free storage space, which is plenty for storing a few NFTs.

### Get an API key

Your API key allows Minty to interact with your Pinata account automatically:

1. Log into Pinata and select **API keys** from the sidebar menu.
1. Click **New Key**.
1. Expand the **Pinning Services API** dropdown and select all the options under **Pins**:

    ![The permissions options available to API keys in Pinata.](./images/pinata-api-key-permissions.png)

1. Pinata will give you an _API key_, and _API secret_, and a _JWT_:

    ```
    API Key: 43537d17e88805007086
    API Secret: 492b24f041b9120cbf8e35a247fb686793231a3d89045f1046a4f5b2d2175082
    JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiZDQ3NjM1Ny1lYWRhLTQ1ZDUtYTVmNS1mM2EwZjRmZGZmYmEiLCJlbWFpbCI6InRhaWxzbm93QHByb3Rvbm1haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZX0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjQzNTM3ZDE3ZTg4ODA1MDA3MDg2Iiwic2NvcGVkS2V5U2VjcmV0IjoiNDkyYjI0ZjA0MWI5MTIwY2JmOGUzNWEyNDdmYjY4Njc5MzIzMWEzZDg5MDQ1ZjEwNDZhNGY1YjJkMjE3NTA4MiIsImlhdCI6MTYxNjAxMzExNX0.xDV9-cPwDIQInuiB0M--XiJ8dQwwDYMch4gJbc6ogXs
    ```

    We just need the `API Key` and `API Secret`. You can ignore the `JWT` for now.

1. 

const fs = require("fs/promises");
const path = require("path");
const CID = require("cids");
const { uid } = require("@onflow/util-uid");
// const ipfsClient = require("ipfs-http-client");
const Nebulus = require("nebulus");
const all = require("it-all");
const uint8ArrayConcat = require("uint8arrays/concat");
const uint8ArrayToString = require("uint8arrays/to-string");
const { loadDeploymentInfo } = require("./deploy");
const FlowMinter = require("../flow/flowMinter");
const generateMetadata = require("../util/generate-metadata");
// The getconfig package loads configuration from files located in the the `config` directory.
// See https://www.npmjs.com/package/getconfig for info on how to override the default config for
// different environments (e.g. testnet, mainnet, staging, production, etc).
const config = require("getconfig");

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions = {
  cidVersion: 1,
  hashAlg: "sha2-256"
};

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Minty>} a new instance of Minty, ready to mint NFTs.
 */
async function MakeMinty() {
  const m = new Minty();
  await m.init();
  return m;
}

async function MakeFlowMinter() {
  const m = new FlowMinter();
  await m.init();
  return m;
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the contract has been deployed and a deployment
 * info file exists (the default location is `minty-deployment.json`)
 *
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported.
 * To make one, use the async {@link MakeMinty} function.
 */
class Minty {
  constructor() {
    this.ipfs = null;
    this.nebulus = null;
    this.flowMinter = null;
    this.deployInfo = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) {
      return;
    }

    // The Minty object expects that the contract has already been deployed, with
    // details written to a deployment info file. The default location is `./minty-deployment.json`,
    // in the config.
    this.deployInfo = await loadDeploymentInfo();
    this.flowMinter = await MakeFlowMinter();

    // create a local IPFS node
    // this.ipfs = ipfsClient(config.ipfsApiUrl);
    this.nebulus = new Nebulus({
      path: path.resolve(__dirname, config.nebulusPath)
    });

    this.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    this._initialized = true;
  }

  //////////////////////////////////////////////
  // ------ NFT Creation
  //////////////////////////////////////////////
  /**
   * Create a new NFT from the given CSV data.
   *
   * @param {string} csvPath - Path to the csv data file
 
   * @typedef {object} BatchCreateNFTResult
   * @property {number} total - the total number of NFTs created

   *
   * @returns {Promise<BatchCreateNFTResult>}
   */
  async createNFTsFromCSVFile(csvPath, cb) {
    const metadatas = await this.gernerateNFTMetadata(csvPath);
    console.log("Minting started...");
    for (const metadata of metadatas) {
      const result = await this.createNFTFromAssetData({
        path: "assets/" + metadata.asset,
        ...metadata
      });
      cb(result);
      await this.sleep(config.RATE_LIMIT_MS);
    }
    return {
      total: metadatas.length
    };
  }

  /**
   * Create a new NFT from the given asset data.
   *
   * @param {object} options
   * @param {?string} path - the path to an image file or other asset to use
   * @param {?string} name - optional name to set in NFT metadata
   * @param {?string} description - optional description to store in NFT metadata
   * @param {?string} owner - optional Flow address that should own the new NFT.
   * If missing, the default signing address will be used.
   *
   * @typedef {object} CreateNFTResult
   * @property {string} txId - The id of the minting transaction
   * @property {number} tokenId - the unique ID of the new token
   * @property {string} ownerAddress - the Flow address of the new token's owner
   * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
   * @property {string} metadataURI - an ipfs:// URI for the NFT metadata
   * @property {string} metadataGatewayURL - an HTTP gateway URL for the NFT metadata
   * @property {string} assetURI - an ipfs:// URI for the NFT asset
   * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
   *
   * @returns {Promise<CreateNFTResult>}
   */

  async createNFTFromAssetData(options) {
    const filePath = options.path || "asset.bin";
    const basename = path.basename(filePath);

    // Using 'folder' gives us URIs with descriptive filenames in them e.g.
    // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
    // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'

    // add the asset to IPFS
    const assetCid = await this.nebulus.folder({
      [basename]: await this.nebulus.add(
        path.resolve(__dirname, "../" + filePath)
      )
    });

    const assetURI = ensureIpfsUriPrefix(assetCid) + "/" + basename;
    const metadata = await this.makeNFTMetadata(assetURI, options);

    // add the metadata to IPFS
    const metadataCid = await this.nebulus.folder({
      "metadata.json": await this.nebulus.add(
        Buffer.from(JSON.stringify(metadata))
      )
    });

    // make the NFT metadata JSON
    const metadataURI = ensureIpfsUriPrefix(metadataCid) + "/metadata.json";

    // Get the address of the token owner from options, or use the default signing address if no owner is given
    let ownerAddress = options.owner;
    if (!ownerAddress) {
      ownerAddress = await this.defaultOwnerAddress();
    }

    // mint a new token referencing the metadata URI
    const minted = await this.mintToken(ownerAddress, metadataURI);
    const deposit = minted.events.find((event) =>
      event.type.includes("Deposit")
    );

    // format and return the results
    const details = {
      txId: deposit.transactionId,
      tokenId: deposit.data.id,
      ownerAddress,
      metadata,
      assetURI,
      metadataURI,
      assetGatewayURL: makeGatewayURL(assetURI),
      metadataGatewayURL: makeGatewayURL(metadataURI)
    };

    await fs.writeFile(
      path.resolve(
        __dirname,
        config.mintDataPath + `/${details.tokenId}-${uid()}.json`
      ),
      JSON.stringify(details),
      "utf8"
    );

    return details;
  }

  /**
   * Create a new NFT from an asset file at the given path.
   *
   * @param {string} filename - the path to an image file or other asset to use
   * @param {object} options
   * @param {?string} name - optional name to set in NFT metadata
   * @param {?string} description - optional description to store in NFT metadata
   * @param {?string} owner - optional Flow address that should own the new NFT.
   * If missing, the default signing address will be used.
   *
   * @returns {Promise<CreateNFTResult>}
   */
  async createNFTFromAssetFile(filename, options) {
    const content = await fs.readFile(filename);
    return this.createNFTFromAssetData(content, { ...options, path: filename });
  }

  /**
   * Helper to construct metadata JSON for
   * @param {string} assetCid - IPFS URI for the NFT asset
   * @param {object} options
   * @param {?string} name - optional name to set in NFT metadata
   * @param {?string} description - optional description to store in NFT metadata
   * @returns {object} - NFT metadata object
   */
  async makeNFTMetadata(assetURI, options) {
    assetURI = ensureIpfsUriPrefix(assetURI);
    // remove the assetpath from the options
    const { path, ...metadata } = options;
    return {
      ...metadata,
      asset: assetURI
    };
  }

  gernerateNFTMetadata(csvPath) {
    const metadata = generateMetadata(csvPath);
    return metadata;
  }

  //////////////////////////////////////////////
  // -------- NFT Retreival
  //////////////////////////////////////////////

  /**
   * Get information about an existing token.
   * By default, this includes the token id, owner address, metadata, and metadata URI.
   * To include info about when the token was created and by whom, set `opts.fetchCreationInfo` to true.
   * To include the full asset data (base64 encoded), set `opts.fetchAsset` to true.
   *
   * @param {string} tokenId
   * @param {object} opts
   * @param {?boolean} opts.fetchAsset - if true, asset data will be fetched from IPFS and returned in assetData (base64 encoded)
   * @param {?boolean} opts.fetchCreationInfo - if true, fetch historical info (creator address and block number)
   *
   *
   * @typedef {object} NFTInfo
   * @property {string} tokenId
   * @property {string} ownerAddress
   * @property {object} metadata
   * @property {string} metadataURI
   * @property {string} metadataGatewayURI
   * @property {string} assetURI
   * @property {string} assetGatewayURL
   * @property {?string} assetDataBase64
   * @property {?object} creationInfo
   * @property {string} creationInfo.creatorAddress
   * @property {number} creationInfo.blockNumber
   * @returns {Promise<NFTInfo>}
   */
  async getNFT(tokenId, opts) {
    const flowData = await this.flowMinter.getNFTDetails(
      config.adminFlowAccount,
      tokenId
    );

    // const { metadata, metadataURI } = await this.getNFTMetadata(tokenId);
    // const ownerAddress = await this.getTokenOwner(tokenId);
    // const metadataGatewayURL = makeGatewayURL(metadataURI);

    // const nft = {
    //   tokenId,
    //   metadata,
    //   metadataURI,
    //   metadataGatewayURL,
    //   ownerAddress
    // };

    // const { fetchAsset, fetchCreationInfo } = opts || {};
    // if (metadata.asset) {
    //   nft.assetURI = metadata.asset;
    //   nft.assetGatewayURL = makeGatewayURL(metadata.asset);
    //   if (fetchAsset) {
    //     nft.assetDataBase64 = await this.getIPFSBase64(metadata.asset);
    //   }
    // }

    // if (fetchCreationInfo) {
    //   nft.creationInfo = await this.getCreationInfo(tokenId);
    // }
    console.log(flowData);
    return flowData;
  }

  /**
   * Fetch the NFT metadata for a given token id.
   *
   * @param tokenId - the id of an existing token
   * @returns {Promise<{metadata: object, metadataURI: string}>} - resolves to an object containing the metadata and
   * metadata URI. Fails if the token does not exist, or if fetching the data fails.
   */
  async getNFTMetadata(tokenId) {
    const metadataURI = await this.contract.tokenURI(tokenId);
    const metadata = await this.getIPFSJSON(metadataURI);

    return { metadata, metadataURI };
  }

  //////////////////////////////////////////////
  // --------- Smart contract interactions
  //////////////////////////////////////////////

  /**
   * Create a new NFT token that references the given metadata CID, owned by the given address.
   *
   * @param {string} ownerAddress - the Flow address that should own the new token
   * @param {string} metadataURI - IPFS URI for the NFT metadata that should be associated with this token
   * @returns {Promise<any>} - The result from minting the token, includes events
   */
  async mintToken(ownerAddress, metadataURI) {
    // the smart contract adds an ipfs:// prefix to all URIs, so make sure it doesn't get added twice
    metadataURI = stripIpfsUriPrefix(metadataURI);
    await this.flowMinter.setupAccount();
    const minted = await this.flowMinter.mint(ownerAddress, metadataURI);
    return minted;
  }

  async transferToken(tokenId, toAddress) {
    // TODO
  }

  /**
   * @returns {Promise<string>} - the default signing address that should own new tokens, if no owner was specified.
   */
  async defaultOwnerAddress() {
    return config.adminFlowAccount;
  }

  /**
   * Get the address that owns the given token id.
   *
   * @param {string} tokenId - the id of an existing token
   * @returns {Promise<string>} - the Flow address of the token owner. Fails if no token with the given id exists.
   */
  async getTokenOwner(tokenId) {
    return; // TODO
  }

  /**
   * Get historical information about the token.
   *
   * @param {string} tokenId - the id of an existing token
   *
   * @typedef {object} NFTCreationInfo
   * @property {number} blockNumber - the block height at which the token was minted
   * @property {string} creatorAddress - the Flow address of the token's initial owner
   *
   * @returns {Promise<NFTCreationInfo>}
   */
  async getCreationInfo(tokenId) {
    let blockNumber, creatorAddress;
    // TODO
    return {
      blockNumber,
      creatorAddress
    };
  }

  //////////////////////////////////////////////
  // --------- IPFS helpers
  //////////////////////////////////////////////

  /**
   * Get the full contents of the IPFS object identified by the given CID or URI.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<Uint8Array>} - contents of the IPFS object
   */
  async getIPFS(cidOrURI) {
    const cid = stripIpfsUriPrefix(cidOrURI);
    return uint8ArrayConcat(await all(this.ipfs.cat(cid)));
  }

  /**
   * Get the contents of the IPFS object identified by the given CID or URI, and return it as a string.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - the contents of the IPFS object as a string
   */
  async getIPFSString(cidOrURI) {
    const bytes = await this.getIPFS(cidOrURI);
    return uint8ArrayToString(bytes);
  }

  /**
   * Get the full contents of the IPFS object identified by the given CID or URI, and return it as a base64 encoded string.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - contents of the IPFS object, encoded to base64
   */
  async getIPFSBase64(cidOrURI) {
    const bytes = await this.getIPFS(cidOrURI);
    return uint8ArrayToString(bytes, "base64");
  }

  /**
   * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - contents of the IPFS object, as a javascript object (or array, etc depending on what was stored). Fails if the content isn't valid JSON.
   */
  async getIPFSJSON(cidOrURI) {
    const str = await this.getIPFSString(cidOrURI);
    return JSON.parse(str);
  }

  //////////////////////////////////////////////
  // -------- Pinning to remote services
  //////////////////////////////////////////////

  /**
   * Pins all IPFS data associated with the given tokend id to the remote pinning service.
   *
   * @param {string} tokenId - the ID of an NFT that was previously minted.
   * @returns {Promise<{assetURI: string, metadataURI: string}>} - the IPFS asset and metadata uris that were pinned.
   * Fails if no token with the given id exists, or if pinning fails.
   */
  async pinTokenData(tokenId) {
    const { metadata, metadataURI } = await this.getNFTMetadata(tokenId);
    const { image: assetURI } = metadata;

    console.log(`Pinning asset data (${assetURI}) for token id ${tokenId}....`);
    await this.pin(assetURI);

    console.log(`Pinning metadata (${metadataURI}) for token id ${tokenId}...`);
    await this.pin(metadataURI);

    return { assetURI, metadataURI };
  }

  /**
   * Request that the remote pinning service pin the given CID or ipfs URI.
   *
   * @param {string} cidOrURI - a CID or ipfs:// URI
   * @returns {Promise<void>}
   */
  async pin(cidOrURI) {
    const cid = extractCID(cidOrURI);

    // Make sure IPFS is set up to use our preferred pinning service.
    await this._configurePinningService();

    // Check if we've already pinned this CID to avoid a "duplicate pin" error.
    const pinned = await this.isPinned(cid);
    if (pinned) {
      return;
    }

    // Ask the remote service to pin the content.
    // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
    // and fetch the data using Bitswap, IPFS's transfer protocol.
    await this.ipfs.pin.remote.add(cid, {
      service: config.pinningService.name
    });
  }

  /**
   * Check if a cid is already pinned.
   *
   * @param {string|CID} cid
   * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
   */
  async isPinned(cid) {
    if (typeof cid === "string") {
      cid = new CID(cid);
    }

    const opts = {
      service: config.pinningService.name,
      cid: [cid] // ls expects an array of cids
    };
    for await (const result of this.ipfs.pin.remote.ls(opts)) {
      return true;
    }
    return false;
  }

  /**
   * Configure IPFS to use the remote pinning service from our config.
   *
   * @private
   */
  async _configurePinningService() {
    if (!config.pinningService) {
      throw new Error(
        `No pinningService set up in minty config. Unable to pin.`
      );
    }

    // check if the service has already been added to js-ipfs
    for (const svc of await this.ipfs.pin.remote.service.ls()) {
      if (svc.service === config.pinningService.name) {
        // service is already configured, no need to do anything
        return;
      }
    }

    // add the service to IPFS
    const { name, endpoint, key } = config.pinningService;
    if (!name) {
      throw new Error("No name configured for pinning service");
    }
    if (!endpoint) {
      throw new Error(`No endpoint configured for pinning service ${name}`);
    }
    if (!key) {
      throw new Error(
        `No key configured for pinning service ${name}.` +
          `If the config references an environment variable, e.g. '$$PINATA_API_TOKEN', ` +
          `make sure that the variable is defined.`
      );
    }
    await this.ipfs.pin.remote.service.add(name, { endpoint, key });
  }

  //////////////////////////////////////////////
  // -------- Metadata
  //////////////////////////////////////////////
}

//////////////////////////////////////////////
// -------- URI helpers
//////////////////////////////////////////////

/**
 * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
 * @returns the input string with the `ipfs://` prefix stripped off
 */
function stripIpfsUriPrefix(cidOrURI) {
  if (cidOrURI.startsWith("ipfs://")) {
    return cidOrURI.slice("ipfs://".length);
  }
  return cidOrURI;
}

function ensureIpfsUriPrefix(cidOrURI) {
  let uri = cidOrURI.toString();
  if (!uri.startsWith("ipfs://")) {
    uri = "ipfs://" + cidOrURI;
  }
  // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
  if (uri.startsWith("ipfs://ipfs/")) {
    uri = uri.replace("ipfs://ipfs/", "ipfs://");
  }
  return uri;
}

/**
 * Return an HTTP gateway URL for the given IPFS object.
 * @param {string} ipfsURI - an ipfs:// uri or CID string
 * @returns - an HTTP url to view the IPFS object on the configured gateway.
 */
function makeGatewayURL(ipfsURI) {
  return config.ipfsGatewayUrl + "/" + stripIpfsUriPrefix(ipfsURI);
}

/**
 *
 * @param {string} cidOrURI - an ipfs:// URI or CID string
 * @returns {CID} a CID for the root of the IPFS path
 */
function extractCID(cidOrURI) {
  // remove the ipfs:// prefix, split on '/' and return first path component (root CID)
  const cidString = stripIpfsUriPrefix(cidOrURI).split("/")[0];
  return new CID(cidString);
}

//////////////////////////////////////////////
// -------- Exports
//////////////////////////////////////////////

module.exports = {
  MakeMinty
};

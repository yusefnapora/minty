import * as fcl from "@onflow/fcl";
import getConfig from "next/config";

import get_nft from "../cadence/scripts/get_nft.cdc";

const { publicRuntimeConfig } = getConfig();

const tempStringReplace = get_nft
  .replace(
    '"../contracts/NonFungibleToken.cdc"',
    publicRuntimeConfig.nonFungibleTokenAddress
  )
  .replace(
    '"../contracts/{{name}}.cdc"',
    publicRuntimeConfig.projectNFTContract
  );

const getNft = async (address, nftId) => {
  console.log(address, nftId);
  return await fcl.query({
    cadence: tempStringReplace,
    args: (arg, t) => [arg(address, t.Address), arg(Number(nftId), t.UInt64)]
  });
};

export default getNft;

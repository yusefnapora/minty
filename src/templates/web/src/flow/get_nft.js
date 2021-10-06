import * as fcl from "@onflow/fcl";

import get_nft from "../../cadence/scripts/get_nft.cdc";
import replaceImports from "./replace-imports";

const getNft = async (address, nftId) => {
  return await fcl.query({
    cadence: replaceImports(get_nft),
    args: (arg, t) => [
      arg(address, t.Address), 
      arg(Number(nftId), t.UInt64),
    ]
  });
};

export default getNft;

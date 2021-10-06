import * as fcl from "@onflow/fcl";

import claim_nft from "../../cadence/transactions/claim_nft.cdc";
import replaceImports from "./replace-imports";

const claimNft = async () => {
  return await fcl.mutate({
    cadence: replaceImports(claim_nft),
    limit: 500,
  });
};

export default claimNft;

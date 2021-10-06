import * as fcl from "@onflow/fcl";
import get_nft from "../../../../Baller NFTs/cadence/scripts/get_nft.cdc";

const tempStringReplace = get_nft
  .replace('"../contracts/NonFungibleToken.cdc"', "0xNFT")
  .replace('"../contracts/BallerNFT.cdc"', "0xBallerNFT");

const getNft = async (address, nftId) => {
  console.log(address, nftId);
  return await fcl.query({
    cadence: tempStringReplace,
    args: (arg, t) => [arg(address, t.Address), arg(Number(nftId), t.UInt64)]
  });
};

export default getNft;

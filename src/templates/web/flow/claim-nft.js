import * as fcl from "@onflow/fcl";

const claimNft = async (address, nftId) => {
  console.log(address, nftId);
  return await fcl.mutate({
    cadence: `
      transaction {
        prepare(acct: AuthAccount) {}
        execute {}
        post {}
      }
    `,
    args: (arg, t) => []
  });
};

export default claimNft;

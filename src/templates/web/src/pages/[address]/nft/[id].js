import AuthCluster from "../../../components/AuthCluster";
import NFT from "../../../components/NFT";

import { useRouter } from "next/router";
import useNFT from "../../../hooks/use-nft";
import useCurrentUser from "../../../hooks/use-current-user";

export default function NFTDetails() {
  const router = useRouter();
  const { address, id } = router.query;

  const user = useCurrentUser()

  const nft = useNFT(address, id);

  return (
    <div>
      <header className="flex items-center h-16 p-3 border-b">
        <div className="container flex flex-row items-center mx-auto">
          <div className="flex-grow">
            <a href="/">NFT Drop</a>
          </div>
          <AuthCluster user={user} />
        </div>
      </header>

      <div className="container mx-auto">
        <div className="flex flex-col items-center py-20">
          {nft.loading ? "Loading..." : <NFT nft={nft} />}
        </div>
      </div>
    </div>
  );
}

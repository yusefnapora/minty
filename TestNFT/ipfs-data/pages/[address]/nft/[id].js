import AuthCluster from "../../../components/AuthCluster";
import { useRouter } from "next/router";
import useCurrentUser from "../../../hooks/use-current-user";
import useNFT from "../../../hooks/use-nft";

export default function NFTDetails() {
  const router = useRouter();
  const { address, id } = router.query;
  const currentUser = useCurrentUser();
  const nft = useNFT(address, id);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  if (!currentUser.loggedIn) {
    router.push("/");
  }

  return (
    <div>
      <header className="flex items-center h-16 p-3 border-b">
        <div className="container flex flex-row items-center mx-auto">
          <div className="flex-grow">
            <a href="/">NFT Drop</a>
          </div>
          <AuthCluster />
        </div>
      </header>

      <div className="container mx-auto">
        <div className="flex flex-col items-center py-20">
          <pre>{JSON.stringify(nft, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

import AuthCluster from "../components/AuthCluster";
import getConfig from "next/config";

export default function Home() {
  const { publicRuntimeConfig } = getConfig();
  function claim() {
    console.log(
      "%c Get you some NFTS! ",
      "color:limegreen;border:1px solid dodgerblue"
    );
  }

  const count = 100;
  const remaining = 50;

  return (
    <div className="h-screen">
      <header className="flex items-center h-16 p-3 border-b">
        <div className="container flex flex-row items-center mx-auto">
          <div className="flex-grow">
            <a href="/">NFT Drop</a>
          </div>
          <AuthCluster />
        </div>
      </header>

      <div className="container h-full mx-auto">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">
            <span className="text-gray-700">NFT</span> Drop
          </h1>
          <p className="text-gray-700">Welcome to the NFT Drop web app.</p>
        </div>
        <div className="flex flex-col items-center pt-4">
          <button
            onClick={claim}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          >
            Claim NFT
          </button>
          <div className="flex flex-col items-center">
            <div className="pt-4 text-gray-700">
              <p>{count} NFTs were dropped.</p>
              <p>{remaining} NFTs are remaining.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

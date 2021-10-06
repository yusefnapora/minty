import AuthCluster from "./AuthCluster";

export default function Header({ user }) {
  return (
    <header className="flex items-center h-16 p-3 border-b">
      <div className="container flex flex-row items-center mx-auto">
        <div className="flex-grow">
          <a href="/">NFT Drop</a>
        </div>
        <AuthCluster user={user} />
      </div>
    </header>
  );
}

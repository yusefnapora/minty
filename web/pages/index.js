import Head from "next/head";
import AuthCluster from "../components/AuthCluster";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Flow / TikTok Demo</title>
        <meta name="description" content="Flow / TikTok Demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="flex items-center h-16 p-3 border-b">
        <div className="container flex flex-row items-center mx-auto">
          <div className="flex-grow">Flow / TikTok Demo</div>
          <AuthCluster />
        </div>
      </header>

      <div className="container mx-auto"></div>
    </div>
  );
}

import { NextSeo } from "next-seo";
import Head from "next/head";
import "../styles/global.css";

import seoConfig from "../seo-config.js";
import "../fcl.config";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <NextSeo {...seoConfig} />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

import { NextSeo } from "next-seo";

import "../styles/global.css";

import seoConfig from "../seo-config.js";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <NextSeo {...seoConfig} />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

import { NextSeo } from "next-seo";

import "tailwindcss/tailwind.css";

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

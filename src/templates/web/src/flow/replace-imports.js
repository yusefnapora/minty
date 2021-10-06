import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

export default function replaceImports(src) {
  return src
    .replace(
      '"../contracts/NonFungibleToken.cdc"',
      publicRuntimeConfig.nonFungibleTokenAddress
    )
    .replace(
      '"../contracts/{{ name }}.cdc"',
      publicRuntimeConfig.projectNFTContract
    );
}

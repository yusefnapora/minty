import { config } from "@onflow/fcl";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

config()
  .put("env", "local")
  .put("app.detail.icon", "http://localhost:3000/favicon.png")
  .put("app.detail.title", "NFT Drop")
  .put("accessNode.api", publicRuntimeConfig.flowAccessAPI)
  .put("discovery.wallet", publicRuntimeConfig.fclWalletDiscovery);

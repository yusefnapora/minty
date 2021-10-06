import { config } from "@onflow/fcl";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

config()
  .put("env", "local")
  .put("app.detail.icon", "/flow.svg")
  .put("app.detail.title", publicRuntimeConfig.appName)
  .put("accessNode.api", publicRuntimeConfig.flowAccessAPI)
  .put("discovery.wallet", publicRuntimeConfig.fclWalletDiscovery);

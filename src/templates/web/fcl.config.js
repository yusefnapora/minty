import { config } from "@onflow/fcl";

config()
  .put("env", "local")
  .put("accessNode.api", "http://localhost:8888")
  .put("discovery.wallet", "http://localhost:8701/fcl/authn");

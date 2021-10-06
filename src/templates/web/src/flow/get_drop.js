import * as fcl from "@onflow/fcl";

import get_drop from "../../cadence/scripts/get_drop.cdc";
import replaceImports from "./replace-imports";

const getDrop = async () => {
  return await fcl.query({
    cadence: replaceImports(get_drop),
  });
};

export default getDrop;

#!/usr/bin/env bash

# if there's no local ipfs repo, initialize one
if [ ! -d "$HOME/.ipfs" ]; then
  npx go-ipfs init
fi

# if flow-cli is not installed, install
if [ ! ! command -v flow &> /dev/null ]; then
  echo "Flow cli was not found!"
  echo "Please install the Flow cli first: https://docs.onflow.org/flow-cli/install/"
  exit;
fi

echo "Running IPFS and Flow emulator"

run_emulator_cmd="flow emulator --http-port 8888 "
run_ipfs_cmd="npx go-ipfs daemon"

npx concurrently -n flow,ipfs -c yellow,blue "$run_emulator_cmd" "$run_ipfs_cmd" 



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

echo "Flow emulator"

run_emulator_cmd="flow emulator --http-port 8888 "

npx concurrently -n "flow emulator" -c green "$run_emulator_cmd" 



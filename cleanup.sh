#!/usr/bin/env bash

echo "⚠️  WARNING ⚠️  - This will delete ALL LOCAL NFT data."
echo -n "Proceed? (y/n) "
read yesno < /dev/tty

if [ "x$yesno" = "xy" ];then
    rm -rfv ipfs-data/*
    touch ipfs-data/.gitkeep

    rm -rfv mint-data/*
    touch mint-data/.gitkeep

    rm -rfv flow/cadence/transactions/*
    touch flow/cadence/transactions/.gitkeep

    rm -rfv flow/cadence/scripts/*
    touch flow/cadence/scripts/.gitkeep

    rm minty-deployment.json

    echo "🧹 DONE 🧹 (Generated contracts were not removed.)"
else

    echo "Aborting."
    exit 1
fi




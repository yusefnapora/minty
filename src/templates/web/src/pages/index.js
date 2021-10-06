import claimNft from "../flow/claim_nft";
import * as fcl from "@onflow/fcl"

import { useState } from "react"
import { useRouter } from 'next/router'
import useCurrentUser from "../hooks/use-current-user";

import Drop from "../components/Drop";
import DropImage from "../components/DropImage";
import Header from "../components/Header";

export default function Home() {
  const router = useRouter()

  const user = useCurrentUser()

  const [status, setStatus] = useState({ isLoading: false, error: "" });

  async function claim() {
    setStatus({ isLoading: true })

    let txId;

    try {
      txId = await claimNft()
    } catch(err) {
      setStatus({ isLoading: false, error: err })
      return
    }

    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        setStatus({ isLoading: false, error: tx.errorMessage })
        return
      }

      if (fcl.tx.isSealed(tx)) {
        const event = tx.events[0].data
        const nftId = event.id

        fcl.currentUser().snapshot().then((user) => {
          router.push(`/${user.addr}/nft/${nftId}`)
        })
      }
    })
  }

  return (
    <div className="flex flex-col h-screen">

      <Header user={user} />

      <div className="container h-full my-8 mx-auto">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl mb-2 font-bold">NFT Drop</h1>
          <p className="text-gray-700">Welcome to the NFT Drop web app</p>
        </div>

        <div className="flex flex-col items-center pt-4">
          <DropImage />
          <Drop 
            onClaim={claim}
            isLoading={status.isLoading} 
            error={status.error} />
        </div>
        
      </div>
    </div>
  );
}

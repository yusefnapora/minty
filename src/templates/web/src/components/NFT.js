import { toGatewayURL } from "nft.storage"
import { useEffect, useState } from "react";

import fetchWithTimeout from "../fetch";

const timeout = 3000;

export default function NFT({ nft }) {
  const metadataURL = toGatewayURL(nft.metadata)

  const [metadata, setMetadata] = useState({ isLoading: true })

  useEffect(async () => {
    try {
      const metadata = await fetchWithTimeout(metadataURL.href, { timeout }).then(r => r.json())

      const imageURL = toGatewayURL(metadata.asset)
  
      setMetadata({
        image: imageURL.href,
        ...metadata,
      })
    } catch (error) {
      setMetadata({ doesNotExist: true })
    }
  }, [])

  if (metadata.isLoading) {
    return <div>Loading..</div>
  }

  if (metadata.doesNotExist) {
    return <div>NFT #{nft.tokenId} has not been revealed.</div>
  }

  return (
    <div className="w-80 border rounded-lg">
      <img
        className="w-full rounded-t-lg"
        src={metadata.image} 
        alt={metadata.description} />
      <div className="p-4">
        <h2 className="text-xl font-medium mb-2">
          {metadata.name}
          &nbsp;<span className="text-gray-500">#{nft.tokenId}</span>
        </h2>
        <p className="text-gray">{metadata.description}</p>
      </div>
    </div>
  )
}

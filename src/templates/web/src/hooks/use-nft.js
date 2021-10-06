import { useState, useEffect } from "react";
import getNFT from "../flow/get_nft";

export default function useNFT(address, id) {
  const [nft, setNFT] = useState({ loading: true, notfound: undefined });

  useEffect(() => {
    const fetchNFT = async (address, id) => {
      try {
        const nft = await getNFT(address, id);
        nft ? setNFT(nft) : setNFT({ loading: false, notfound: true });
      } catch (e) {
        setNFT({ loading: false, notfound: true });
      }
    };
    if (address && id) {
      fetchNFT(address, id);
    }
  }, [address, id]);

  return nft;
}

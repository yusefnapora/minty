import { useState, useEffect } from "react";
import getDrop from "../flow/get_drop";

export default function useDrop(isLoading) {
  const [drop, setDrop] = useState({ loading: true, notfound: undefined });

  useEffect(() => {
    const fetchDrop = async () => {
      try {
        const drop = await getDrop();
        drop ? setDrop(drop) : setDrop({ loading: false, notfound: true });
      } catch (e) {
        setDrop({ loading: false, notfound: true });
      }
    };

    fetchDrop();
  }, [isLoading]);

  return drop;
}

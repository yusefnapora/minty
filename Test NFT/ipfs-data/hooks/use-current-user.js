import { useState, useEffect } from "react";
import * as fcl from "@onflow/fcl";

export default function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => fcl.currentUser().subscribe(setCurrentUser), []);
  return currentUser;
}

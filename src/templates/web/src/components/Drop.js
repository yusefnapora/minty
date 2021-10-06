import useDrop from "../hooks/use-drop";
import DropButton from "./DropButton";
import DropInfo from "./DropInfo";

export default function Drop({ onClaim, isLoading, error }) {
  const drop = useDrop(isLoading)

  if (drop.loading) {
    return null
  }

  const isInactive = !!drop.notfound
  const isSoldOut = drop.supply === 0 || drop.status === "closed"
  const supply = drop.status === "closed" ? 0 : drop.supply

  return (
    <>
      <DropButton
        onClick={() => onClaim()}
        isInactive={isInactive}
        isSoldOut={isSoldOut}
        isLoading={isLoading} 
        error={error} />
      {!isInactive && 
        <DropInfo 
          supply={supply} 
          size={drop.size} />}
    </>
  );
}

function getColor(error) {
  return error ? "bg-red-600" : "bg-black"
}

function getText(isLoading, isInactive, isSoldOut, error) {
  if (error) return "Error";
  if (isLoading) return "Loading...";
  if (isInactive) return "No active drop";
  if (isSoldOut) return "Sold out!";
  return "Claim NFT"
}

function getDisabled(isLoading, isInactive, isSoldOut, error) {
  if (error || isLoading || isInactive || isSoldOut) return true;
  return false
}

export default function DropButton({ 
  onClick,
  isLoading,
  isInactive,
  isSoldOut,
  error 
}) {
  const color = getColor(error)
  const text = getText(isLoading, isInactive, isSoldOut, error)
  const disabled = getDisabled(isLoading, isInactive, isSoldOut, error)

  return (
    <button
      className={`${color} ${disabled && "disabled:opacity-50"} text-xl text-white px-4 py-3 mx-2 rounded-md`}
      onClick={onClick}
      disabled={disabled}>
      {text}
    </button>
  );
}

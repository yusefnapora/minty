export default function DropInfo({ supply, size }) {
  return (
    <p className="my-4 text-gray-700 text-center">{supply} / {size} NFTs remaining</p>
  );
}

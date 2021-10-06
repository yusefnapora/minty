
import Image from 'next/image'
import icon from '../../public/favicon.png'

export default function DropImage() {
  return (
    <div className="w-80 p-4 mb-4 rounded-t-lg border">
      <Image
        src={icon} 
        alt="Claim NFT" />
    </div>
  );
}

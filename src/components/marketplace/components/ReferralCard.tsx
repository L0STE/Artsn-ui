import Image from 'next/image';

const ReferralCard = () => {
  return (
    <div className="relative max-w-sm rounded-3xl border-gray p-4 overflow-hidden flex flex-col justify-between">
      {/* Car Image in the background */}
      <div className="absolute w-96 h-full object-cover opacity-75" style={{right: "-300px"}}>
        <Image src="/images/car.png" alt="Car" layout="fill" objectFit="contain" priority />
      </div>
      <p></p>
      
      {/* Content */}
      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-2">Invite your friends & earn your reward!</h2>
        <p className="text-xs text-gray-500 mb-4">
          You and your friend will both receive $10 when your friend invests in their first Artisan offering.
        </p>
        <button className="bg-black text-white text-xs px-4 py-3 rounded-2xl" disabled={true}>
          Join the Artisan Referral program
        </button>
      </div>

      {/* Learn More link */}
      <div className="mt-4 text-gray-500 text-xs">
        <a href="#" className="underline">Learn more about the Referral program</a>
      </div>
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center rounded-3xl z-[40]">
        <div className="bg-white/20 px-6 py-3 rounded-lg shadow-lg">
          <p className="text-md font-semibold text-gray-800">Feature Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;

import Image from "next/image";
import React from "react";
import subhero1 from "../../../public/images/subhero1.png";
import subhero2 from "../../../public/images/subhero2.png";
import subhero3 from "../../../public/images/subhero3.png";
import subhero4 from "../../../public/images/subhero4.png";

const Subhero = () => {
  const subhero = [
    {
      id: 1,
      image: subhero1,
      title: "Free Shipping",
      desc: "For all orders $200",
    },
    {
      id: 2,
      image: subhero2,
      title: "1 & 1 Returns",
      desc: "Cancellation after 1 day",
    },
    {
      id: 3,
      image: subhero3,
      title: "100% Secure Payments",
      desc: "Guarantee Secure Payments",
    },
    {
      id: 4,
      image: subhero4,
      title: "24/7 Dedicated Support",
      desc: "Anywhere & anytime",
    },
  ];
  return (
    <div className="mx-5 xl:mx-20 mt-10">
      {/* SubHero 1  */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-center md:gap-3 lg:gap-0 flex-wrap ">
        {subhero.map((hero, index) => (
          <div key={index} className="flex pb-3 md:pb-0 items-center gap-4">
            <Image src={hero.image} className="w-10" alt={hero.title} />
            <div className="flex flex-col pb-3 md:pb-0">
              <h1 className="text-lg md:text-[18px] lg:text-[17px] xl:text-[18px] font-semibold">
                {hero.title}
              </h1>
              <p className="text-sm text-gray-500">{hero.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subhero;

import React from "react";
import purchase1 from "../../../public/images/purchase1.png";
import purchase2 from "../../../public/images/newarrival2.png";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Purchase = () => {
  return (
    <div className="w-full container mx-auto mt-10 mb-10">
      <div className="flex flex-col lg:flex-row mx-5 xl:mx-0 gap-8">
        {/* LEFT CONTENT */}
        <div
          className="rounded-md w-full flex flex-col md:flex-row justify-between items-center 
        lg:items-center px-6 sm:px-5 md:pl-0 md:pr-10 py-10 bg-[#D6ECE8] "
        >
          {/* Image */}
          <div className="flex justify-center w-full lg:justify-start mb-7 lg:mb-0">
            <Image
              src={purchase2}
              alt="purchase2"
              className="w-[300px] md:w-[260px] lg:w-[300px]"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col items-start md:items-end text-right w-full max-w-[300px] lg:max-w-none ">
            <h2 className="text-sm md:text-base xl:text-lg">
              Foldable Motorised Treadmill
            </h2>

            <h1 className="text-xl md:text-[24px] xl:text-[30px] text-black/80 font-bold mt-2">
              Workout At Home
            </h1>

            <h3 className="text-xl md:text-[21px] xl:text-[23px] mt-2 font-semibold text-[#009B72]">
              Flat 20% off
            </h3>
            <Link href="/product/fitness">
              <Button
                className="
                text-white bg-[#00a579] hover:bg-[#048e69] 
                rounded-full mt-7 
                px-8 py-3 font-semibold cursor-pointer
                "
              >
                Grab Now
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="rounded-md w-full flex flex-col md:flex-row justify-between items-center px-10 py-10 bg-[#F6E4D3]">
          {/* Text */}
          <div className="flex flex-col items-start order-2 md:order-1">
            <h2 className="text-lg">Apple Watch Ultra</h2>
            <h1 className="text-[20px] md:text-[27px] xl:text-[30px] text-black/80 font-bold mt-2">
              Up to 40% Off
            </h1>

            <p className="text-sm mt-2 w-[60%] md:w-[90%]">
              The aerospace-grade titanium case strikes the perfect balance of
              everything.
            </p>
            <Link href="/product/applewatch">
              <Button className="text-white bg-[#F37A2F] hover:bg-[#df6e28] rounded-full mt-7 px-8 py-3 font-semibold cursor-pointer">
                Buy Now
              </Button>
            </Link>
          </div>

          {/* Image */}
          <div className="flex justify-center md:justify-end mt-7 md:mt-0 order-1 md:order-2 mb-10 md:mb-0">
            <Image
              src={purchase1}
              alt="purchase1"
              className="w-[200px] md:w-[300px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchase;

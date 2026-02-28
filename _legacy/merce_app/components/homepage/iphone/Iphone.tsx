import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import phone from "../../../public/images/iphone14.png";
import Link from "next/link";

const Iphone = () => {
  return (
    <div className="w-full container mx-auto mt-10">
      <div className="bg-gray-200/70 my-14">
        <div className="flex flex-col md:flex-row gap-3 w-full justify-between pt-18 px-8 md:px-18 ">
          {/* Left Content  */}
          <div className="flex flex-col w-full md:w-[50%] mt-10">
            <h3 className="font-semibold text-[20px]">Apple iPhone 14 Plus</h3>
            <h1 className="font-bold text-[28px] md:text-[44px] mt-3">
              UP TO 30% OFF
            </h1>
            <p className="mt-3">
              iPhone 14 has the same superspeedy chip that's in iPhone 13 Pro,
              A15 Bionic, with a 5‑core GPU, powers all the latest features.
            </p>
            <Link href="/product/iphone14">
              <button className="w-32 mt-7 rounded-full py-2  bg-blue-700 text-white hover:bg-blue-800 ">
                Buy Now
              </button>
            </Link>
          </div>

          {/* Right Content  */}
          <div className="">
            <Image src={phone} alt="iPhone" className="w-[300px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Iphone;

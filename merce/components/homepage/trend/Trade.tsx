"use client";

import React from "react";
import subscribe from "../../../public/images/subscribe.jpg";
import { useState } from "react";
import { useRouter } from "next/navigation";

const Trade = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubscribe = () => {
    if (!email.trim()) return;

    setEmail("");
    router.push("/");
  };

  return (
    <div className="w-full container mx-auto mt-14">
      <div className="mx-5 xl:mx-0">
        <div
          className="w-full rounded-md bg-cover bg-center "
          style={{
            backgroundImage: `url('${subscribe.src}')`,
          }}
        >
          {/* Main Content */}
          <div className="flex flex-col md:flex-row justify-between  md:items-center py-10 md:py-10 px-4 md:px-16">
            {/* Left Content */}
            <div className="flex flex-col">
              <h1 className="text-[20px] md:text-[22px] lg:text-[32px] text-white font-bold w-full lg:w-[70%]">
                Don&apos;t Miss Out Latest Trends & Offers

              </h1>
              <p className="text-white mt-3">
                Register to receive news about the latest offers & discount
                codes
              </p>
            </div>

            {/* right content */}
            <div className="flex flex-col mt-5 md:mt-0 md:flex-row items-start md:items-center justify-start md:justify-center gap-4">
              <div className="bg-white px-10 py-3 w-full rounded-full">
                <input
                  type="email"
                  value={email}
                  placeholder="Enter your email"
                  className="border-none outline-none"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                onClick={handleSubscribe}
                className="bg-blue-700 hover:bg-blue-800 cursor-pointer text-md text-white/90 font-semibold w-full text-center px-7 py-3 rounded-full"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;

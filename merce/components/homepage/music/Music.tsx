"use client";

import React, { useEffect, useState } from "react";
import musicbg from "../../../public/images/bgmusic.jpg";
import headphone from "../../../public/images/music.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SIX_DAYS_IN_SECONDS = 6 * 24 * 60 * 60;

const Music = () => {
  const [timeLeft, setTimeLeft] = useState(SIX_DAYS_IN_SECONDS);

  // Countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return SIX_DAYS_IN_SECONDS; // restart
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // convert time
  const days = Math.floor(timeLeft / (24 * 60 * 60));
  const hours = Math.floor((timeLeft % (24 * 60 * 60)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const format = (n: number): string => n.toString().padStart(2, "0");

  return (
    <div className="w-full container mx-auto mt-10">
      {/* Background image container */}
      <div
        className="w-full rounded-md bg-cover bg-center "
        style={{
          backgroundImage: `url('${musicbg.src}')`,
        }}
      >
        {/* Main Content */}
        <div className="flex justify-between items-center py-4 md:py-16 px-4 md:px-16">
          {/* text content */}
          <div className="flex flex-col gap-4">
            <h1 className="text-blue-700 font-semibold text-[22px]">
              Dont Miss!!
            </h1>

            <h2 className="text-black/80 font-bold leading-14 text-[25px] md:text-[42px] w-full md:w-[90%]">
              Enhance Your Music Experience
            </h2>

            <p className="text-md">iPhone 16 Pro Max</p>

            {/* Countdown */}
            <div className="flex flex-row gap-5">
              {/* Days */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white text-black/80 rounded-md text-xl md:text-3xl px-5 py-3 font-semibold">
                  {format(days)}
                </div>
                <p className="text-sm">Days</p>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white text-black/80 rounded-md text-xl md:text-3xl px-5 py-3 font-semibold">
                  {format(hours)}
                </div>
                <p className="text-sm">Hours</p>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white text-black/80 rounded-md text-xl md:text-3xl px-5 py-3 font-semibold">
                  {format(minutes)}
                </div>
                <p className="text-sm">Minutes</p>
              </div>

              {/* Seconds */}
              <div className="flex flex-col text-black/80 items-center gap-2">
                <div className="bg-white rounded-md text-xl md:text-3xl px-5 py-3 font-semibold">
                  {format(seconds)}
                </div>
                <p className="text-sm">Seconds</p>
              </div>
            </div>
            <Link href="/">
              <Button className="px-10 py-6 mt-3 w-[40%] md:w-[25%] rounded-full text-white bg-blue-700 hover:bg-blue-600 cursor-pointer">
                Check it Out!
              </Button>
            </Link>
          </div>

          {/* image content */}
          <div className="hidden md:flex">
            <Image alt="music" src={headphone} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Music;

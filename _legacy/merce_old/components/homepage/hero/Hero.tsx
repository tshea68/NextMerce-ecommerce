"use client";

import React from "react";
import Image from "next/image";
import Hero1 from "../../../public/images/hero1.jpg";
import Hero2 from "../../../public/images/hero2.jpg";
import Hero3 from "../../../public/images/hero3.jpg";
import Hero4 from "../../../public/images/hero4.png";
import Hero5 from "../../../public/images/hero5.png";
import { Card, CardContent } from "@/components/ui/card";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Link from "next/link";

const Hero = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    plugin.current,
  ]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", () =>
      setSelectedIndex(emblaApi.selectedScrollSnap()),
    );
  }, [emblaApi]);

  const heroSlides = [
    {
      image: Hero1,
      tag: "Premium Design",
      title: "Redmi 14 Pro",
      desc: "Experience a sleek and powerful smartphone built to redefine mobile excellence with cutting-edge performance and camera quality.",
      link: "/product/iphone14",
    },
    {
      image: Hero3,
      tag: "Special Edition",
      title: "Apple AirPods Max",
      desc: "Immerse yourself in spatial audio with premium sound quality and luxury design tailored for music lovers everywhere.",
      link: "/product/ipad",
    },
    {
      image: Hero2,
      tag: "Limited Edition",
      title: "iPhone 16 Pro Max",
      desc: "Featuring A18 Chip, Liquid Glass, and AI-powered innovation that delivers unmatched performance and durability.",
      link: "/product/iphone16promax",
    },
  ];

  return (
    <div className="w-full flex flex-col xl:flex-row md:mt-5 gap-4 px-6 py-6 xl:px-1 xl:py-1 items-center mt-10">
      {/* === Left Carousel Section === */}
      <div className=" w-full xl:w-[70%] relative">
        {/* Embla Carousel */}
        <div className="overflow-hidden rounded-md" ref={emblaRef}>
          <div className="flex">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className="relative flex-[0_0_100%] h-[300px] md:h-[480px] overflow-hidden rounded-xl"
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover rounded-xl"
                  priority
                />

                {/* Overlay text */}
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 gap-4 text-white bg-black/30">
                  <p className="uppercase tracking-wide text-md md:text-sm font-bold md:font-medium">
                    {slide.tag}
                  </p>
                  <h2 className=" text-xl md:text-4xl font-semibold">
                    {slide.title}
                  </h2>
                  <p className="max-w-md text-[12px] md:text-sm leading-relaxed text-gray-200">
                    {slide.desc}
                  </p>
                  <Link href={slide.link}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full w-fit mt-2">
                      Shop Now
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Pills */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                selectedIndex === index
                  ? "bg-blue-600 w-5 h-1"
                  : "bg-gray-300/90 w-4 h-1"
              }`}
            />
          ))}
        </div>
      </div>

      {/* === Right Static Images === */}
      <div className="flex flex-col md:flex-row xl:flex-col xl:w-[30%] gap-4 xl:h-[480px]">
        {/* Hero 4 Card */}
        <div className="bg-[#E5F3FF] flex justify-between  px-6 py-6 gap-5 rounded-md flex-1">
          <div className="flex flex-col justify-between h-[180px]">
            <Link href="/product/television">
              <h1 className="text-[22px] font-semibold text-gray-800 cursor-pointer hover:text-blue-600">
                Smart Security Home Camera
              </h1>
            </Link>
            <p className="text-sm text-gray-700 font-semibold">
              Save up to{" "}
              <span className="text-blue-700 font-semibold text-[16px]">
                $450
              </span>
            </p>
          </div>
          <div className="flex justify-end">
            <Image
              src={Hero4}
              alt="Hero4"
              className="w-48 h-48 object-contain"
            />
          </div>
        </div>

        {/* Hero 5 Card */}
        <div className="bg-[#F2EEE8] flex justify-between px-6 py-6 gap-10 rounded-md flex-1">
          <div className="flex flex-col gap-2 justify-between">
            <Link href="/product/iphone16promax">
              <h1 className="text-[22px] font-semibold text-gray-800 cursor-pointer hover:text-blue-600">
                Galaxy S24 Ultra 5G
              </h1>
            </Link>
            <p className="text-sm font-semibold text-gray-700 items-center">
              Save up to{" "}
              <span className="text-blue-700 font-semibold text-[16px]">
                $600
              </span>
            </p>
          </div>
          <div className="flex justify-end">
            <Image
              src={Hero5}
              alt="Hero5"
              className="w-48 h-48 xl:w-44 xl:h-44 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

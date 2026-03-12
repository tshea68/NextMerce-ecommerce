"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import browse1 from "../../../public/images/browse1.png";
import browse2 from "../../../public/images/browse2.png";
import browse3 from "../../../public/images/browse3.png";
import browse4 from "../../../public/images/browse4.png";
import browse5 from "../../../public/images/browse5.png";
import browse6 from "../../../public/images/browse6.png";
import browse7 from "../../../public/images/browse7.png";

const Editbrowse = () => {
  const browseItems = [
    {
      id: 1,
      image: browse1,
      title: "Laptop & PC",
      link: "/categories/laptop-pc",
    },
    { id: 2, image: browse2, title: "Watches", link: "/categories/watches" },
    {
      id: 3,
      image: browse3,
      title: "Mobile & Tablets",
      link: "/categories/mobile-tablets",
    },
    {
      id: 4,
      image: browse4,
      title: "Health & Sports",
      link: "/categories/health-sports",
    },
    {
      id: 5,
      image: browse5,
      title: "Home Appliances",
      link: "/categories/home-appliances",
    },
    {
      id: 6,
      image: browse6,
      title: "Games & Videos",
      link: "/categories/games-videos",
    },
    {
      id: 7,
      image: browse7,
      title: "Televisions",
      link: "/categories/televisions",
    },
  ];

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = () => {
    const c = carouselRef.current;
    if (!c) return;
    setCanScrollPrev(c.scrollLeft > 0);
    const maxScroll = c.scrollWidth - c.clientWidth - c.scrollLeft;
    setCanScrollNext(maxScroll > 8);
  };

  useEffect(() => {
    updateScrollState();
  }, []);

  // Scroll one item width
  const handleNext = () => {
    const c = carouselRef.current;
    if (!c) return;

    const firstItem = c.querySelector("div.flex-shrink-0");
    if (!firstItem) return;

    const itemWidth = (firstItem as HTMLElement).offsetWidth + 24; // gap-6
    c.scrollBy({ left: itemWidth, behavior: "smooth" });
    setTimeout(updateScrollState, 500);
  };

  const handlePrev = () => {
    const c = carouselRef.current;
    if (!c) return;

    const firstItem = c.querySelector("div.flex-shrink-0");
    if (!firstItem) return;

    const itemWidth = (firstItem as HTMLElement).offsetWidth + 24;
    c.scrollBy({ left: -itemWidth, behavior: "smooth" });
    setTimeout(updateScrollState, 500);
  };

  return (
    <div className="w-full container mx-auto mt-10">
      {/* Header */}
      <div className="flex mx-5 xl:mx-2 justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Browse by Category</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={!canScrollPrev}
            aria-label="previous"
            className={`rounded-full border transition-all w-10 h-10 flex items-center justify-center
              ${
                canScrollPrev
                  ? "bg-white text-black hover:bg-blue-600 hover:text-white border-gray-300"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={handleNext}
            disabled={!canScrollNext}
            aria-label="next"
            className={`rounded-full border transition-all w-10 h-10 flex items-center justify-center
              ${
                canScrollNext
                  ? "bg-white text-black hover:bg-blue-600 hover:text-white border-gray-300"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="
            flex gap-1 scroll-smooth overflow-x-auto select-none scroll-px-4
            [scrollbar-width:none] [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
        "
        style={{ scrollBehavior: "smooth" }}
      >
        {browseItems.map((item) => (
          <Link
            href={item.link}
            key={item.id}
            className="
                shrink-0
                w-1/2 sm:w-1/2 md:w-1/4 lg:w-1/4 xl:w-1/6
                text-center
            "
          >
            <div>
              <Card className="border-none shadow-none   transition rounded-2xl cursor-pointer">
                <CardContent className="group flex flex-col items-center justify-center p-4">
                  <div className="bg-gray-100 rounded-full p-5 mb-3">
                    <Image
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <h2
                    className="relative text-sm md:text-[16px] font-semibold text-gray-700 text-center
                group-hover:text-blue-700 after:content-[''] after:absolute after:left-0 after:bottom-0 
                after:h-0.5 after:bg-blue-600 after:w-0 group-hover:after:w-full after:transition-all 
                after:duration-500 after:ease-out"
                  >
                    {item.title}
                  </h2>
                </CardContent>
              </Card>
            </div>
          </Link>
        ))}
      </div>

      <hr className="text-gray-300 mt-6 mb-4" />
    </div>
  );
};

export default Editbrowse;

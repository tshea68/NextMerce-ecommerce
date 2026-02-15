"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import browse1 from "../../../public/images/browse1.png";
import browse2 from "../../../public/images/browse2.png";
import browse3 from "../../../public/images/browse3.png";
import browse4 from "../../../public/images/browse4.png";
import browse5 from "../../../public/images/browse5.png";
import browse6 from "../../../public/images/browse6.png";
import browse7 from "../../../public/images/browse7.png";

const Browse = () => {
  const browseItems = [
    { id: 1, image: browse1, title: "Laptop & PC" },
    { id: 2, image: browse2, title: "Watches" },
    { id: 3, image: browse3, title: "Mobile & Tablets" },
    { id: 4, image: browse4, title: "Health & Sports" },
    { id: 5, image: browse5, title: "Home Appliances" },
    { id: 6, image: browse6, title: "Games & Videos" },
    { id: 7, image: browse7, title: "Televisions" },
  ];

  // simple local tracking of active scroll
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const updateScroll = () => {
      setCanScrollPrev(carousel.scrollLeft > 0);
      const maxScroll =
        carousel.scrollWidth - carousel.clientWidth - carousel.scrollLeft;
      setCanScrollNext(maxScroll > 10);
    };

    carousel.addEventListener("scroll", updateScroll);
    updateScroll();

    return () => carousel.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <div className="mx-5 xl:mx-10 mt-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Browse by Category</h1>

        <div className="flex items-center gap-3">
          <button
            disabled={!canScrollPrev}
            onClick={() =>
              carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" })
            }
            className={`rounded-full border transition-all w-8 h-8 flex items-center justify-center 
              ${
                canScrollPrev
                  ? "bg-white text-black hover:bg-blue-600 hover:text-white border-gray-300"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
          >
            ‹
          </button>

          <button
            disabled={!canScrollNext}
            onClick={() =>
              carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" })
            }
            className={`rounded-full border transition-all w-8 h-8 flex items-center justify-center 
              ${
                canScrollNext
                  ? "bg-white text-black hover:bg-blue-600 hover:text-white border-gray-300"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide gap-6 scroll-smooth"
      >
        {browseItems.map((item) => (
          <div key={item.id} className="min-w-[130px] shrink-0 text-center">
            <Card className="border-none shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <div className="bg-gray-100 rounded-full p-5 mb-3">
                  <Image
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h2 className="text-sm font-semibold text-gray-700">
                  {item.title}
                </h2>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Browse;

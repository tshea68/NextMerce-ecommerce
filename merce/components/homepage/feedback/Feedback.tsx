"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import feedback11 from "../../../public/images/feedback11.png";
import feedback2 from "../../../public/images/feedback2.png";

const Feedback = () => {
  const feedback = [
    {
      id: 1,
      image: feedback11,
      para: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores voluptatibus adipisci fugit animi sit.",
      desc: "David Dorwart",
      sdesc: "Serial Entrepreneur",
    },
    {
      id: 2,
      image: feedback2,
      para: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores voluptatibus adipisci fugit animi sit.",
      desc: "Wilson Dias",
      sdesc: "Backend Developer",
    },
    {
      id: 3,
      image: feedback11,
      para: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores voluptatibus adipisci fugit animi sit.",
      desc: "David Dorwart",
      sdesc: "Serial Entrepreneur",
    },
    {
      id: 4,
      image: feedback2,
      para: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores voluptatibus adipisci fugit animi sit.",
      desc: "Wilson Dias",
      sdesc: "Backend Developer",
    },
  ];

  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateButtons = () => {
    const c = carouselRef.current;
    if (!c) return;

    const atStart = c.scrollLeft <= 2;
    const atEnd = c.scrollLeft + c.clientWidth >= c.scrollWidth - 2;

    setCanPrev(!atStart);
    setCanNext(!atEnd);
  };

  useEffect(() => {
    updateButtons();

    const c = carouselRef.current;
    if (!c) return;

    c.addEventListener("scroll", updateButtons);
    return () => c.removeEventListener("scroll", updateButtons);
  }, []);

  const slide = (dir: "next" | "prev") => {
    const c = carouselRef.current;
    if (!c) return;

    const firstCard = c.querySelector(".feedback-card") as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width + 20;

    c.scrollBy({
      left: dir === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full container mx-auto mt-10">
      {/* Header */}
      <div className="flex mx-5 xl:mx-2 justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">User Feedbacks</h1>

        <div className="flex items-center gap-3">
          {/* Prev Button */}
          <button
            onClick={() => slide("prev")}
            disabled={!canPrev}
            aria-label="prev"
            className={`rounded-full w-10 h-10 flex items-center justify-center border transition 
            ${
              canPrev
                ? "bg-white text-black hover:bg-blue-600 hover:text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Next Button */}
          <button
            onClick={() => slide("next")}
            disabled={!canNext}
            aria-label="next"
            className={`rounded-full w-10 h-10 flex items-center justify-center border transition 
            ${
              canNext
                ? "bg-white text-black hover:bg-blue-600 hover:text-white"
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
          flex gap-0 xl:gap-6 overflow-x-auto scroll-smooth select-none 
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {feedback.map((feed) => (
          <div
            key={feed.id}
            className="feedback-card shrink-0 w-full sm:w-1/2 xl:w-1/3"
          >
            <div className="rounded-md border shadow p-8 mx-5 xl:mx-0">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className="text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              <p className="text-start">{feed.para}</p>

              <div className="flex items-center gap-4 mt-4">
                <Image
                  alt="feedback"
                  src={feed.image}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h1 className="font-semibold">{feed.desc}</h1>
                  <p className="text-gray-600">{feed.sdesc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feedback;

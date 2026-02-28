"use client";

import React from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Arrival1 from "../../../public/images/newarrival1.png";
import Arrival2 from "../../../public/images/newarrival2.png";
import Arrival3 from "../../../public/images/newarrival3.png";
import Arrival4 from "../../../public/images/newarrival4.png";
import Arrival5 from "../../../public/images/newarrival5.png";
import Arrival6 from "../../../public/images/newarrival6.png";
import Arrival7 from "../../../public/images/newarrival7.png";
import Arrival8 from "../../../public/images/newarrival8.png";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";

const page = () => {
  const newarrivals = [
    {
      id: 1,
      image: Arrival8,
      title: "Apple iMac M4 24-inch 2025",
      desc: "$333",
      sdesc: "$555",
    },
    {
      id: 2,
      image: Arrival7,
      title: "MacBook Air M4 chip, 16/256GB",
      desc: "$600",
      sdesc: "$699",
    },
  ];

  const [openDropdown, setOpenDropdown] = useState(false);
  const [selected, setSelected] = useState("Latest Products");
  const [view, setView] = useState<"grid" | "list">("grid");

  const toggleDropdown = () => setOpenDropdown((prev) => !prev);

  const selectOption = (value: string) => {
    setSelected(value);
    setOpenDropdown(false);
  };

  return (
    <div className="">
      {/* Header  */}
      <div className="flex mt-10 justify-between items-center">
        <h1 className="font-semibold text-4xl text-black/80">
          Our Best Products
        </h1>
        <div className="flex gap-2">
          <Link href="/">
            <p className="cursor-pointer hover:text-blue-500">Home /</p>
          </Link>
          <p>Shop /</p>
          <p className="text-blue-500">Popular</p>
        </div>
      </div>

      {/* Body  */}
      <div className="bg-gray-100/90 mt-10 mb-16 w-full">
        <div className="flex justify-between pt-28 ">
          <div className="bg-white shadow-sm px-4 py-3 w-full flex justify-between relative">
            {/* LEFT CONTENT */}
            <div className="flex gap-5 items-center cursor-pointer">
              {/* DROPDOWN BUTTON */}
              <div
                onClick={toggleDropdown}
                className="flex gap-1 items-center border border-gray-300 text-gray-400 px-5 py-2.5 rounded-md text-sm"
              >
                {selected}
                {openDropdown ? (
                  <ChevronUp size={18} className="mt-1" />
                ) : (
                  <ChevronDown size={18} className="mt-1" />
                )}
              </div>

              <h1>Showing 2 of 2 Products</h1>
            </div>

            {/* DROPDOWN MENU */}
            {openDropdown && (
              <div className="absolute top-16 left-4 bg-white border shadow-md rounded-md w-40 text-sm z-50">
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectOption("Latest Products")}
                >
                  Latest Products
                </div>
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectOption("Best Selling")}
                >
                  Best Selling
                </div>
              </div>
            )}

            {/* RIGHT CONTENT */}
            <div className="flex items-center gap-3">
              {/* GRID BUTTON */}
              <div
                onClick={() => setView("grid")}
                className={`cursor-pointer px-2.5 py-1.5 rounded-sm 
              ${
                view === "grid"
                  ? "bg-blue-700/90 hover:bg-blue-700"
                  : "bg-gray-100 hover:bg-blue-700 border"
              }`}
              >
                <LayoutGrid
                  size={20}
                  className={`${view === "grid" ? "text-white" : "text-black hover:text-white"}`}
                />
              </div>

              {/* LIST BUTTON */}
              <div
                onClick={() => setView("list")}
                className={`cursor-pointer px-2.5 py-1.5 rounded-sm 
              ${
                view === "list"
                  ? "bg-blue-700/90 hover:bg-blue-700"
                  : "bg-gray-100 hover:bg-blue-700 border"
              }`}
              >
                <List
                  size={20}
                  className={`${view === "list" ? "text-white" : "text-black hover:text-white"}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCT LISTING */}
        <div className="mx-5 xl:mx-0 mt-8 pb-28">
          {/* GRID VIEW */}
          {view === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {newarrivals.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="bg-white rounded-md">
                    <Image src={item.image} alt={item.title} className="p-8" />
                  </div>

                  {/* HOVER BUTTONS */}
                  <div
                    className="absolute inset-x-0 bottom-20 flex items-center justify-center gap-3 opacity-0 translate-y-3
                                group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <div className="bg-white text-black rounded-full p-2 shadow">
                      <Eye
                        className="text-gray-600 hover:text-blue-600"
                        size={16}
                      />
                    </div>
                    <Button className="rounded-full px-5 py-3 bg-blue-700/90 text-white hover:bg-blue-700">
                      Add to Cart
                    </Button>
                    <div className="bg-white text-black rounded-full p-2 shadow">
                      <Heart
                        className="text-gray-600 hover:text-blue-600"
                        size={16}
                      />
                    </div>
                  </div>

                  <h2 className="font-semibold mt-4 hover:text-blue-700 cursor-pointer">
                    {item.title}
                  </h2>

                  <div className="flex items-center mt-1 gap-1 text-lg">
                    <p className="text-gray-500 font-medium line-through">
                      {item.sdesc}
                    </p>
                    <p className="font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="flex flex-col gap-6">
              {newarrivals.map((item) => (
                <div
                  key={item.id}
                  className="bg-white w-full flex px-6 py-10 rounded-md shadow-sm border group relative"
                >
                  {/* LEFT — PRODUCT IMAGE */}
                  <div className="min-w-[220px] flex flex-col items-center justify-start relative">
                    {/* Image */}
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={230}
                      height={230}
                      className="object-contain"
                    />

                    {/* HOVER BUTTONS UNDER IMAGE */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center gap-3 
                                  opacity-0 translate-y-3
                                  group-hover:opacity-100 group-hover:translate-y-0
                                  transition-all duration-300"
                    >
                      <div className="bg-white text-black rounded-full p-2 shadow">
                        <Eye
                          className="text-gray-600 hover:text-blue-600"
                          size={16}
                        />
                      </div>

                      <Button className="rounded-full px-5 py-3 bg-blue-700/90 text-white hover:bg-blue-700">
                        Add to Cart
                      </Button>

                      <div className="bg-white text-black rounded-full p-2 shadow">
                        <Heart
                          className="text-gray-600 hover:text-blue-600"
                          size={16}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BORDER BETWEEN IMAGE AND TEXT */}
                  <div className="border-r mx-6"></div>

                  {/* RIGHT — TEXT CONTENT */}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-lg font-semibold text-black/90 hover:text-blue-700 cursor-pointer">
                      {item.title}
                    </h2>

                    <div className="flex items-center mt-3 gap-3 text-lg">
                      <p className="text-gray-500 font-medium line-through">
                        {item.sdesc}
                      </p>
                      <p className="font-semibold">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default page;

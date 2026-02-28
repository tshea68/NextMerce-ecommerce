"use client";

import React from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Arrival1 from "../../public/images/newarrival1.png";
import Arrival2 from "../../public/images/newarrival2.png";
import Arrival3 from "../../public/images/newarrival3.png";
import Arrival4 from "../../public/images/newarrival4.png";
import Arrival5 from "../../public/images/newarrival5.png";
import Arrival6 from "../../public/images/newarrival6.png";
import Arrival7 from "../../public/images/newarrival7.png";
import Arrival8 from "../../public/images/newarrival8.png";
import Arrival9 from "../../public/images/console.png";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";

const page = () => {
  const newarrivals = [
    {
      id: "imac",
      image: Arrival8,
      title: "Apple iMac M4 24-inch 2025",
      desc: "$333",
      sdesc: "$555",
    },

    {
      id: "ipad",
      image: Arrival5,
      title: "Apple iPad Pro Max",
      desc: "$450",
      sdesc: "$500",
    },
    {
      id: "16promax",
      image: Arrival4,
      title: "iPhone 16 Pro Max",
      desc: "$899",
      sdesc: "$930",
    },
    {
      id: "macbook",
      image: Arrival7,
      title: "MacBook Air M4 chip, 16/256GB",
      desc: "$600",
      sdesc: "$699",
    },
    {
      id: "fitness",
      image: Arrival2,
      title: "Indoor Steel Adjustable Silent Treadmill",
      desc: "$888",
      sdesc: "$999",
    },
    {
      id: "television",
      image: Arrival3,
      title: "Range 43 inch Frameless FHD Double...",
      desc: "$700",
      sdesc: "$800",
    },
    {
      id: "gamepad",
      image: Arrival9,
      title: "Havic HV-G69 USB Gamepad",
      desc: "$26",
      sdesc: "$54",
    },
    {
      id: "16pro",
      image: Arrival4,
      title: "iPhone 16 Pro - 8/128GB",
      desc: "$600",
      sdesc: "$899",
    },
    {
      id: "applewatch",
      image: Arrival6,
      title: "Apple Watch Ultra",
      desc: "$89",
      sdesc: "$99",
    },
    {
      id: "grinder",
      image: Arrival1,
      title: "Portable Electric Grinder Maker",
      desc: "$777",
      sdesc: "$800",
    },
  ];

  const [openDropdown, setOpenDropdown] = useState(false);
  const [selected, setSelected] = useState("Latest Products");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pageNumber, setPageNumber] = useState(1);
  // first correction
  const {
    addToCart,
    cartItems,
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useCart();

  const [showWishlistAlert, setShowWishlistAlert] = useState(false);
  const [wishlistAction, setWishlistAction] = useState<"add" | "remove">("add");
  const [showAlert, setShowAlert] = useState(false);

  // for routing different product
  const router = useRouter();

  const itemsPerPage = 8;

  const paginatedProducts = newarrivals.slice(
    (pageNumber - 1) * itemsPerPage,
    pageNumber * itemsPerPage,
  );

  const toggleDropdown = () => setOpenDropdown((prev) => !prev);

  const selectOption = (value: string) => {
    setSelected(value);
    setOpenDropdown(false);
  };

  // Route for product listing
  const getProductRoute = (title: string) => {
    const t = title.toLowerCase();

    if (t.includes("imac")) return "/product/imac";
    if (t.includes("ipad")) return "/product/ipad";

    // ✅ iPhone rules (specific → general)
    if (t.includes("iphone 16 pro max")) return "/product/iphone16promax";

    if (t.includes("iphone 16 pro")) return "/product/iphone14";

    // fallback for other iphones if needed
    if (t.includes("iphone")) return "/product/iphone14";

    if (t.includes("macbook")) return "/product/macbook";
    if (t.includes("treadmill") || t.includes("fitness"))
      return "/product/fitness";
    if (t.includes("frameless") || t.includes("tv") || t.includes("television"))
      return "/product/television";
    if (t.includes("gamepad")) return "/product/gamepad";
    if (t.includes("watch")) return "/product/applewatch";
    if (t.includes("grinder")) return "/product/grinder";

    return "/product";
  };

  return (
    <div className="">
      {showAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
            <div className="bg-green-600 rounded-full p-1">
              <Check size={16} className="text-white" />
            </div>
            <p className="text-sm font-medium text-black">
              Product added to cart
            </p>
          </div>
        </div>
      )}

      {/* wishlist alert   */}
      {showWishlistAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
            <div className="bg-green-600 rounded-full p-1">
              <Check size={16} className="text-white" />
            </div>
            <p className="text-sm font-medium text-black">
              {wishlistAction === "add"
                ? "Product added to wishlist"
                : "Product removed from wishlist"}
            </p>
          </div>
        </div>
      )}

      {/* Header  */}
      <div className="flex flex-col md:flex-row mt-10 justify-between gap-2 md:gap-0 px-2 items-start md:items-center">
        <h1 className="font-semibold text-[21px] md:text-4xl text-black/80">
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
        <div className="flex justify-between pt-10 lg:pt-24 px-3 lg:px-0 ">
          <div className="bg-white rounded-md shadow-sm px-4 py-3 w-full flex justify-between relative">
            {/* LEFT CONTENT */}
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center cursor-pointer">
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

              <h1>Showing 10 of 10 Products</h1>
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
              {paginatedProducts.map((item) => {
                const isInCart = cartItems.some((ci) => ci.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="relative group cursor-pointer"
                    onClick={() => router.push(getProductRoute(item.title))} // ✅ route applied
                  >
                    <div className="bg-white rounded-md">
                      <Image
                        src={item.image}
                        alt={item.title}
                        className="p-8"
                      />
                    </div>

                    {/* HOVER BUTTONS */}
                    <div
                      className="absolute inset-x-0 bottom-20 flex items-center justify-center gap-3
                            opacity-0 translate-y-3
                            group-hover:opacity-100 group-hover:translate-y-0
                            transition-all duration-300"
                      onClick={(e) => e.stopPropagation()} // ✅ prevent navigation
                    >
                      <div className="bg-white text-black rounded-full p-2 shadow">
                        <Eye
                          className="text-gray-600 hover:text-blue-600"
                          size={16}
                        />
                      </div>

                      <Button
                        onClick={() => {
                          if (isInCart) {
                            router.push("/checkout");
                            return;
                          }

                          addToCart({
                            id: item.id,
                            title: item.title,
                            price: Number(item.desc.replace("$", "")),
                            image: item.image.src,
                          });

                          setShowAlert(true);
                          setTimeout(() => setShowAlert(false), 2500);
                        }}
                        className={`rounded-full px-5 py-3 text-white cursor-pointer
                                        ${
                                          isInCart
                                            ? "bg-blue-950 hover:bg-blue-900"
                                            : "bg-blue-700/90 hover:bg-blue-700"
                                        }
                                      `}
                      >
                        {isInCart ? "Checkout" : "Add to Cart"}
                      </Button>

                      {/* Heart Icon  */}
                      {(() => {
                        const isWishlisted = wishlistItems.some(
                          (wi) => wi.id === item.id,
                        );

                        return (
                          <div
                            onClick={() => {
                              if (isWishlisted) {
                                removeFromWishlist(item.id);
                                setWishlistAction("remove");
                              } else {
                                addToWishlist({
                                  id: item.id,
                                  title: item.title,
                                  price: Number(item.desc.replace("$", "")),
                                  image: item.image.src,
                                });
                                setWishlistAction("add");
                              }

                              setShowWishlistAlert(true);
                              setTimeout(
                                () => setShowWishlistAlert(false),
                                2000,
                              );
                            }}
                            className="bg-white rounded-full p-2 shadow cursor-pointer"
                          >
                            <Heart
                              size={16}
                              className={`
                                            transition-all
                                            ${
                                              isWishlisted
                                                ? "fill-blue-950 text-blue-950 hover:fill-blue-700 hover:text-blue-700"
                                                : "text-gray-600 hover:text-blue-600"
                                            }
                                          `}
                            />
                          </div>
                        );
                      })()}
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
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="flex flex-col gap-6">
              {newarrivals.map((item) => (
                <div
                  key={item.id}
                  className="bg-white w-full flex px-6 py-10 rounded-md shadow-sm border group relative cursor-pointer"
                  onClick={() => router.push(getProductRoute(item.title))} // ✅ routing
                >
                  {/* LEFT — PRODUCT IMAGE */}
                  <div className="min-w-0 md:min-w-[220px] flex flex-col items-center justify-start relative">
                    {/* Image */}
                    <Image
                      src={item.image}
                      alt={item.title}
                      className="object-contain w-[150px] md:w-[230px]"
                    />

                    {/* HOVER BUTTONS UNDER IMAGE */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center gap-3
                              opacity-0 translate-y-3
                              group-hover:opacity-100 group-hover:translate-y-0
                              transition-all duration-300"
                      onClick={(e) => e.stopPropagation()} // ✅ prevent route trigger
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

                      {/* Heart Icon  */}
                      {(() => {
                        const isWishlisted = wishlistItems.some(
                          (wi) => wi.id === item.id,
                        );

                        return (
                          <div
                            onClick={() => {
                              if (isWishlisted) {
                                removeFromWishlist(item.id);
                                setWishlistAction("remove");
                              } else {
                                addToWishlist({
                                  id: item.id,
                                  title: item.title,
                                  price: Number(item.desc.replace("$", "")),
                                  image: item.image.src,
                                });
                                setWishlistAction("add");
                              }

                              setShowWishlistAlert(true);
                              setTimeout(
                                () => setShowWishlistAlert(false),
                                2000,
                              );
                            }}
                            className="bg-white rounded-full p-2 shadow cursor-pointer"
                          >
                            <Heart
                              size={16}
                              className={`
                                              transition-all
                                              ${
                                                isWishlisted
                                                  ? "fill-blue-950 text-blue-950 hover:fill-blue-700 hover:text-blue-700"
                                                  : "text-gray-600 hover:text-blue-600"
                                              }
                                            `}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* BORDER BETWEEN IMAGE AND TEXT */}
                  <div className="border-r mx-6"></div>

                  {/* RIGHT — TEXT CONTENT */}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-sm md:text-lg font-semibold text-black/90 hover:text-blue-700 cursor-pointer">
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

          {/* FOOTER BUTTONS */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {/* PREV */}
            <button
              onClick={() => setPageNumber(1)}
              disabled={pageNumber === 1}
              className={`py-2 px-4 rounded-sm border cursor-pointer 
              ${
                pageNumber === 1
                  ? "text-gray-400 border-gray-200 bg-white"
                  : "text-black border-gray-300 bg-white"
              }`}
            >
              Prev
            </button>

            {/* PAGE 1 */}
            <div
              onClick={() => setPageNumber(1)}
              className={`py-2 px-4 rounded-sm cursor-pointer border 
              ${
                pageNumber === 1
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              1
            </div>

            {/* PAGE 2 */}
            <div
              onClick={() => setPageNumber(2)}
              className={`py-2 px-4 rounded-sm cursor-pointer border 
              ${
                pageNumber === 2
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              2
            </div>

            {/* NEXT */}
            <button
              onClick={() => setPageNumber(2)}
              disabled={pageNumber === 2}
              className={`py-2 px-4 rounded-sm border cursor-pointer
              ${
                pageNumber === 2
                  ? "text-gray-400 border-gray-200 bg-white"
                  : "text-black border-gray-300 bg-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;

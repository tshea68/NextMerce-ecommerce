"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";

import Arrival1 from "../../../public/images/newarrival1.png";
import Arrival2 from "../../../public/images/newarrival2.png";
import Arrival3 from "../../../public/images/newarrival3.png";
import Arrival4 from "../../../public/images/newarrival4.png";
import Arrival5 from "../../../public/images/newarrival5.png";
import Arrival6 from "../../../public/images/newarrival6.png";
import Arrival7 from "../../../public/images/newarrival7.png";
import Arrival8 from "../../../public/images/newarrival8.png";

const Arrival = () => {
  const newarrivals = [
    {
      id: "grinder",
      image: Arrival1,
      title: "Portable Electric Grinder Maker",
      desc: "$777",
      sdesc: "$800",
      link: "/product/grinder",
    },
    {
      id: "fitness",
      image: Arrival2,
      title: "Indoor Steel Adjustable Silent Treadmill",
      desc: "$888",
      sdesc: "$999",
      link: "/product/fitness",
    },
    {
      id: "television",
      image: Arrival3,
      title: "Range 43 inch Frameless FHD Double...",
      desc: "$700",
      sdesc: "$800",
      link: "/product/television",
    },
    {
      id: "16promax",
      image: Arrival4,
      title: "iPhone 16 Pro Max",
      desc: "$899",
      sdesc: "$930",
      link: "/product/iphone16promax",
    },
    {
      id: "ipad",
      image: Arrival5,
      title: "Apple iPad Pro Max",
      desc: "$450",
      sdesc: "$500",
      link: "/product/ipad",
    },
    {
      id: "applewatch",
      image: Arrival6,
      title: "Apple Watch Ultra",
      desc: "$89",
      sdesc: "$99",
      link: "/product/applewatch",
    },
    {
      id: "macbook",
      image: Arrival7,
      title: "MacBook Air M4 chip, 16/256GB",
      desc: "$600",
      sdesc: "$699",
      link: "/product/macbook",
    },
    {
      id: "imac",
      image: Arrival8,
      title: "Apple iMac M4 24-inch 2025",
      desc: "$333",
      sdesc: "$555",
      link: "/product/imac",
    },
  ];

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

  const router = useRouter();

  return (
    <div className="w-full container mx-auto mt-10">
      {/* Alert */}
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

      {/* second correction  */}
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

      {/* Header */}
      <div className="flex mx-5 xl:mx-2 justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">New Arrivals</h1>
        <Link href="/popular">
          <Button className="bg-gray-50 text-black hover:bg-blue-950 hover:text-white cursor-pointer px-7 py-5 border border-gray-200 rounded-full">
            View All
          </Button>
        </Link>
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8 mx-5 xl:mx-0">
        {newarrivals.map((item) => {
          const isInCart = cartItems.some((ci) => ci.id === item.id);

          return (
            <div key={item.id} className="relative group">
              <Link href={item.link}>
                <div className="bg-gray-100/80 rounded-md">
                  <Image src={item.image} alt={item.title} className="p-8" />
                </div>
              </Link>

              {/* Hover Buttons */}
              <div
                className="absolute inset-x-0 bottom-20 flex items-center justify-center gap-3
                           opacity-0 translate-y-3 group-hover:opacity-100
                           group-hover:translate-y-0 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-full p-2 shadow">
                  <Eye
                    size={16}
                    className="text-gray-600 hover:text-blue-600"
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

                {/* third correction  */}
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
                        setTimeout(() => setShowWishlistAlert(false), 2000);
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
                <p className="font-semibold">{item.desc}</p>
                <p className="text-gray-500 line-through">{item.sdesc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Arrival;

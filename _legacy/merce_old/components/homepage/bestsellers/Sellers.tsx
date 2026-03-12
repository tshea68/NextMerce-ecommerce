"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingCart, Check } from "lucide-react";
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

const Sellers = () => {
  const newarrivals = [
    {
      id: "imac",
      image: Arrival8,
      title: "Apple iMac M4 24-inch 2025",
      desc: "$333",
      sdesc: "$555",
      link: "/product/imac",
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
      id: "16promax",
      image: Arrival4,
      title: "iPhone 16 Pro Max",
      desc: "$899",
      sdesc: "$930",
      link: "/product/iphone16promax",
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
        <h1 className="text-2xl font-semibold">Best Sellers</h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-5 xl:mx-0">
        {newarrivals.map((item) => {
          const isInCart = cartItems.some((ci) => ci.id === item.id);

          return (
            <div key={item.id} className="relative group">
              <Link href={item.link}>
                <div className="bg-gray-100/80 rounded-md pt-5">
                  <h2 className="font-semibold mt-4 text-center hover:text-blue-700">
                    {item.title}
                  </h2>

                  <div className="flex justify-center gap-2 mt-1 text-lg">
                    <p className="text-gray-500 line-through">{item.sdesc}</p>
                    <p className="font-semibold">{item.desc}</p>
                  </div>

                  <Image src={item.image} alt={item.title} className="p-14" />
                </div>
              </Link>

              {/* Hover Icons */}
              <div
                className="
                  absolute bottom-4 right-4
                  flex flex-col gap-3
                  opacity-0 translate-y-3
                  group-hover:opacity-100 group-hover:translate-y-0
                  transition-all duration-300
                "
                onClick={(e) => e.stopPropagation()}
              >
                {/* Quick View */}
                <IconWrapper label="Quick View">
                  <Eye size={16} />
                </IconWrapper>

                {/* Add to Cart / Checkout */}
                <IconWrapper
                  label={isInCart ? "Checkout" : "Add To Cart"}
                  active={isInCart}
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
                >
                  <ShoppingCart size={16} />
                </IconWrapper>

                {/* Wishlist */}
                {(() => {
                  const isWishlisted = wishlistItems.some(
                    (wi) => wi.id === item.id,
                  );

                  return (
                    <IconWrapper
                      label={isWishlisted ? "Added" : "Add To Wishlist"}
                    >
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
                        className="rounded-full shadow cursor-pointer"
                      >
                        <Heart
                          size={16}
                          className={`
                        transition-all
                        ${
                          isWishlisted
                            ? "fill-blue-950 text-blue-950 hover:fill-blue-950 hover:text-blue-950"
                            : "text-gray-600 hover:text-white"
                        }
                      `}
                        />
                      </div>
                    </IconWrapper>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-10">
        <Link href="/popular">
          <Button className="bg-gray-50 cursor-pointer hover:bg-blue-950 text-black hover:text-white px-10 py-[22px] border rounded-full">
            View All
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Sellers;

/* -------------------------------- */
/* Reusable Icon Wrapper */
/* -------------------------------- */
const IconWrapper = ({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) => (
  <div className="relative flex items-center">
    <div
      onClick={onClick}
      className={`
        peer p-2 rounded-full shadow cursor-pointer
        flex items-center justify-center transition
        ${active ? "bg-blue-950 text-white" : "bg-white hover:bg-blue-700 hover:text-white"}
      `}
    >
      {children}
    </div>

    <div
      className="
        absolute right-full mr-3
        bg-white text-black shadow-lg
        px-4 py-2 rounded-full text-sm font-semibold
        whitespace-nowrap
        opacity-0 translate-x-2
        peer-hover:opacity-100 peer-hover:translate-x-0
        transition-all duration-300
      "
    >
      {label}
    </div>
  </div>
);

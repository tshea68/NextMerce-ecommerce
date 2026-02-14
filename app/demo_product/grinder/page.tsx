"use client";

import React from "react";
import Link from "next/link";
import Arrival1 from "../../../public/images/newarrival1.png";
import Arrival2 from "../../../public/images/newarrival2.png";
import Arrival3 from "../../../public/images/newarrival3.png";
import Arrival4 from "../../../public/images/newarrival4.png";
import Arrival5 from "../../../public/images/newarrival5.png";
import Arrival6 from "../../../public/images/newarrival6.png";
import Arrival7 from "../../../public/images/newarrival7.png";
import Arrival8 from "../../../public/images/newarrival8.png";
import Arrival9 from "../../../public/images/console.png";
import product9 from "../../../public/images/newarrival1.png";
import product10 from "../../../public/images/blender.png";
import review1 from "../../../public/images/feedback11.png";
import review2 from "../../../public/images/feedback2.png";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import subscribe from "../../../public/images/subscribe.jpg";
import {
  ArrowRight,
  Scan,
  Star,
  Eye,
  Heart,
  CircleCheck,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";

const page = () => {
  const reviews = [
    {
      id: 1,
      name: "Pascal",
      role: "User",
      avatar: review1,
      rating: 5,
      comment: "Good Product",
    },
    {
      id: 2,
      name: "Peter",
      role: "User",
      avatar: review1,
      rating: 2,
      comment: "Nice Product",
    },
    {
      id: 3,
      name: "Dave",
      role: "User",
      avatar: review2,
      rating: 1,
      comment: "Worth it",
    },
    {
      id: 4,
      name: "Dan",
      role: "User",
      avatar: review1,
      rating: 5,
      comment: "Really Nice",
    },
    {
      id: 5,
      name: "Michael",
      role: "User",
      avatar: review1,
      rating: 4,
      comment: "Nice",
    },
    {
      id: 6,
      name: "Richard",
      role: "User",
      avatar: review2,
      rating: 4,
      comment: "Perfect",
    },
    {
      id: 7,
      name: "Promise",
      role: "User",
      avatar: review1,
      rating: 5,
      comment: "I love it",
    },
    {
      id: 8,
      name: "Aare",
      role: "User",
      avatar: review2,
      rating: 3,
      comment: "Good",
    },
    {
      id: 9,
      name: "Bright",
      role: "User",
      avatar: review1,
      rating: 2,
      comment: "Great",
    },
    {
      id: 10,
      name: "Clement",
      role: "User",
      avatar: review2,
      rating: 4,
      comment: "lovely",
    },
    {
      id: 11,
      name: "Wisdom",
      role: "User",
      avatar: review1,
      rating: 5,
      comment: "Great product",
    },
    {
      id: 12,
      name: "Okafor",
      role: "User",
      avatar: review1,
      rating: 3,
      comment: "Gud tek",
    },
    {
      id: 13,
      name: "Bright",
      role: "User",
      avatar: review2,
      rating: 4,
      comment: "Lovely",
    },
    {
      id: 14,
      name: "Bernard",
      role: "User",
      avatar: review1,
      rating: 2,
      comment: "Nice Product",
    },
    {
      id: 15,
      name: "Franklin",
      role: "User",
      avatar: review1,
      rating: 3,
      comment: "Good",
    },
  ];

  type Review = {
    id: number;
    name: string;
    role: string;
    avatar: any;
    rating: number;
    comment: string;
  };

  const [count, setCount] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selected, setSelected] = useState("Latest Products");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "description" | "additional" | "reviews"
  >("description");
  const [reviewsList, setReviewsList] = useState<Review[]>(reviews);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const MAX_LENGTH = 250;
  const [showAlert, setShowAlert] = useState(false);
  // const [cartOpen, setCartOpen] = useState(false);
  // const [cartItems, setCartItems] = useState<any[]>([]);

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

  // for routing different product
  const router = useRouter();

  // const isInCart = cartItems.some(item => item.id === 1);

  const {
    cartItems,
    addToCart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useCart();

  const [showWishlistAlert, setShowWishlistAlert] = useState(false);
  const [wishlistAction, setWishlistAction] = useState<"add" | "remove">("add");

  // ✅ DERIVED product from newarrivals (single source of truth)
  const product = newarrivals.find((item) => item.id === "grinder");

  const isInCart = cartItems.some((cartItem) => cartItem.id === product?.id);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = () => {
    const c = carouselRef.current;
    if (!c) return;

    setCanScrollPrev(c.scrollLeft > 0);
    setCanScrollNext(c.scrollLeft + c.clientWidth < c.scrollWidth - 5);
  };

  useEffect(() => {
    const c = carouselRef.current;
    if (!c) return;

    updateScrollState();
    c.addEventListener("scroll", updateScrollState);

    return () => c.removeEventListener("scroll", updateScrollState);
  }, []);

  const handleNext = () => {
    const c = carouselRef.current;
    if (!c) return;

    const firstItem = c.querySelector(".shrink-0") as HTMLElement;
    if (!firstItem) return;

    c.scrollBy({
      left: firstItem.offsetWidth + 24,
      behavior: "smooth",
    });
  };

  const handlePrev = () => {
    const c = carouselRef.current;
    if (!c) return;

    const firstItem = c.querySelector(".shrink-0") as HTMLElement;
    if (!firstItem) return;

    c.scrollBy({
      left: -(firstItem.offsetWidth + 24),
      behavior: "smooth",
    });
  };

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

  const images = [product9, product10];

  const [selectedColor, setSelectedColor] = useState<0 | 1 | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length);

  const prevImage = () =>
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  // handle cart function
  const handleAddToCart = (item = product) => {
    if (!item) return;

    addToCart({
      id: item.id, // ✅ string
      title: item.title,
      image: item.image.src, // ✅ store string URL (FIXES /cart image)
      price: Number(item.desc.replace("$", "")), // ✅ normalized number
    });

    setCartOpen(true);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2000);
  };

  const handleSubmitReview = () => {
    if (rating === 0) return alert("Add your rating");
    if (!comment.trim()) return alert("Kindly add your comment");
    if (!name.trim()) return alert("Kindly add your Name");
    if (!email.trim()) return alert("Kindly add your email");

    const newReview: Review = {
      id: Date.now(),
      name,
      role: "User",
      avatar: review1,
      rating,
      comment,
    };

    setReviewsList((prev) => [newReview, ...prev]);

    setRating(0);
    setComment("");
    setName("");
    setEmail("");
  };

  // Route for recently viewed
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

    return "/product";
  };

  return (
    <div>
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
        <h1 className="font-semibold text-[21px] md:text-3xl text-black/80">
          Shop Details
        </h1>
        <div className="flex gap-2">
          <Link href="/">
            <p className="cursor-pointer hover:text-blue-500 text-sm">Home /</p>
          </Link>
          <p className="text-blue-500 text-sm">Shop Details</p>
        </div>
      </div>

      <hr className="mt-10" />

      {/* Body  */}
      <div className="mt-12 lg:mt-24  mb-16 w-full">
        <div className="flex flex-col lg:flex-row px-6 xl:px-0 gap-9 xl:gap-14 w-full">
          {/* Left Content  */}
          <div className="flex flex-col gap-6 w-full lg:w-[50%] ">
            {/* main image  */}
            <div className="relative bg-gray-100 px-28 py-20 rounded-lg">
              {/* icon */}
              <div
                onClick={() => {
                  setIsOpen(true);
                  setActiveIndex(currentImageIndex);
                }}
                className="absolute top-4 right-4 bg-white rounded-full p-3
                                    shadow-sm cursor-pointer hover:shadow-md transition group"
              >
                <Scan
                  size={18}
                  className="text-gray-600 group-hover:text-blue-700"
                />
              </div>
              <Image src={images[currentImageIndex]} alt="" width={400} />
            </div>

            {/* mini products  */}
            <div className="flex gap-4">
              {/* Mini image 1 */}
              <div
                onClick={() => setCurrentImageIndex(0)}
                className={`bg-gray-100 px-8 py-8 rounded-lg cursor-pointer
                    ${
                      currentImageIndex === 0
                        ? "border-2 border-blue-700"
                        : "hover:border-2 hover:border-blue-700"
                    }`}
              >
                <Image src={product9} alt="" width={50} />
              </div>

              {/* Mini image 2 */}
              <div
                onClick={() => setCurrentImageIndex(1)}
                className={`bg-gray-100 px-8 py-8 rounded-lg cursor-pointer
                    ${
                      currentImageIndex === 1
                        ? "border-2 border-blue-700"
                        : "hover:border-2 hover:border-blue-700"
                    }`}
              >
                <Image src={product10} alt="" width={50} />
              </div>
            </div>
          </div>

          {/* image open modal  */}
          {isOpen && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-white text-3xl"
              >
                ×
              </button>

              {/* Left Arrow */}
              <button
                onClick={prevImage}
                className="absolute left-6 text-white text-4xl hover:scale-110 transition"
              >
                ←
              </button>

              {/* Image */}
              <Image
                src={images[activeIndex]}
                alt="Product Preview"
                className="max-w-[80%] max-h-[80%] object-contain"
              />

              {/* Right Arrow */}
              <button
                onClick={nextImage}
                className="absolute right-6 text-white text-4xl hover:scale-110 transition"
              >
                →
              </button>
            </div>
          )}

          {/* Right Content  */}
          <div className="w-full lg:w-[50%]">
            {/* Head */}
            <div className="flex justify-between items-center gap-1">
              <h1
                className="
                    flex-1 min-w-0
                    text-md md:text-2xl xl:text-4xl
                    font-semibold text-black/80
                    leading-snug
                "
              >
                Portable Electric Grinder Maker
              </h1>

              <button
                className="
                    bg-blue-700 text-white
                    text-[12px] xl:text-[11px]
                    font-medium
                    px-2 py-0.5
                    rounded-full
                    whitespace-nowrap
                    "
              >
                30% OFF
              </button>
            </div>

            {/* star  */}
            <div className="flex gap-2 md:gap-5 mt-3">
              {/* star  */}
              <div className="flex fill-gray-400 items-center gap-1 md:gap-2 ">
                <Star size={19} className="fill-gray-300 text-gray-300" />
                <Star size={19} className="fill-gray-300  text-gray-300" />
                <Star size={19} className="fill-gray-300  text-gray-300" />
                <Star size={19} className="fill-gray-300  text-gray-300" />
                <Star size={19} className="fill-gray-300  text-gray-300" />
              </div>

              <div>( 0 customer reviews )</div>

              <div className="flex gap-1 text-green-600">
                <CircleCheck />
                <p>In Stock</p>
              </div>
            </div>

            <div className="flex gap-1 mt-5">
              <h1 className="text-xl md:text-2xl font-semibold">Price:</h1>
              <span className="text-gray-500 font-semibold ml-1 text-xl md:text-2xl">
                $888
              </span>
              <span className="text-xl md:text-2xl font-semibold">$777</span>
            </div>

            <hr className="mt-10" />

            {/* color */}
            <div className="flex items-center gap-8 mt-10">
              <h1 className="font-semibold">Color:</h1>

              <div className="flex items-center gap-3">
                {/* Gray color */}
                <div
                  onClick={() => {
                    setSelectedColor(0);
                    setCurrentImageIndex(0);
                  }}
                  className="h-5 w-5 rounded-full bg-white border border-gray-300 cursor-pointer flex items-center justify-center"
                >
                  {selectedColor === 0 && (
                    <Check size={16} className="text-black font-bold" />
                  )}
                </div>

                {/* White color */}
                <div
                  onClick={() => {
                    setSelectedColor(1);
                    setCurrentImageIndex(1);
                  }}
                  className="h-5 w-5 rounded-full bg-black cursor-pointer flex items-center justify-center"
                >
                  {selectedColor === 1 && (
                    <Check size={16} className="text-white font-bold" />
                  )}
                </div>
              </div>
            </div>

            <hr className="mt-10" />

            {/* buttons  */}
            <div className="flex flex-wrap items-center gap-4 mt-10">
              {/* counter  */}
              <div className="inline-flex items-center h-12 border border-gray-200 rounded-full overflow-hidden bg-white">
                {/* Minus */}
                <button
                  onClick={() => setCount(Math.max(1, count - 1))}
                  className="cursor-pointer px-5 h-full flex items-center justify-center text-xl font-medium hover:text-blue-600"
                >
                  –
                </button>

                {/* Divider */}
                <div className="w-px h-full bg-gray-200" />

                {/* Count */}
                <span className="px-6 h-full flex items-center justify-center text-md font-medium">
                  {count}
                </span>

                {/* Divider */}
                <div className="w-px h-full bg-gray-200" />

                {/* Plus */}
                <button
                  onClick={() => setCount(count + 1)}
                  className="cursor-pointer px-5 h-full flex items-center justify-center text-xl font-medium hover:text-blue-600"
                >
                  +
                </button>
              </div>

              {/* purchase  */}
              <div>
                <Link href="/checkout">
                  <button className="bg-blue-700 text-white font-semibold hover:bg-blue-800 px-8 py-3 rounded-full cursor-pointer">
                    Purchase Now
                  </button>
                </Link>
              </div>

              {/* cart  */}
              <div>
                <button
                  onClick={() => handleAddToCart()}
                  disabled={isInCart}
                  className={`
                                px-8 py-3 rounded-full font-semibold cursor-pointer
                                ${
                                  isInCart
                                    ? "bg-[#0e1b53bd] cursor-not-allowed text-white"
                                    : "bg-[#121e52] hover:bg-[#162251ec] text-white"
                                }
                            `}
                >
                  {isInCart ? "Added" : "Add to Cart"}
                </button>
              </div>

              {/* wishlist */}
              {product &&
                (() => {
                  const isWishlisted = wishlistItems.some(
                    (wi) => wi.id === product.id,
                  );

                  return (
                    <div
                      onClick={() => {
                        if (isWishlisted) {
                          removeFromWishlist(product.id);
                          setWishlistAction("remove");
                        } else {
                          addToWishlist({
                            id: product.id,
                            title: product.title,
                            price: Number(product.desc.replace("$", "")),
                            image: product.image.src, // ✅ string
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
          </div>
        </div>
      </div>

      {/* subbody */}
      <div className="bg-gray-100/90 mt-10 py-20 mb-16 w-full">
        <div className="bg-white rounded-lg py-6 px-2 md:px-4 grid-cols-1 md:grid-cols-2">
          {/* grid 1 */}
          <div className="flex justify-between md:justify-start gap-2 md:gap-8 lg:gap-12 w-full lg:w-[50%] px-4 lg:px-0">
            <p
              onClick={() => setActiveTab("description")}
              className={`text-md lg:text-[18px] font-semibold cursor-pointer pb-2
                    ${
                      activeTab === "description"
                        ? "text-blue-700 border-b-2 border-blue-700"
                        : "text-black hover:text-blue-700 hover:border-b-2 hover:border-blue-700"
                    }
                    `}
            >
              Description
            </p>

            <p
              onClick={() => setActiveTab("additional")}
              className={`text-md lg:text-[18px] font-semibold cursor-pointer pb-2
                    ${
                      activeTab === "additional"
                        ? "text-blue-700 border-b-2 border-blue-700"
                        : "text-black hover:text-blue-700 hover:border-b-2 hover:border-blue-700"
                    }
                    `}
            >
              Additional Information
            </p>

            <p
              onClick={() => setActiveTab("reviews")}
              className={`text-md lg:text-[18px] font-semibold cursor-pointer pb-2
                    ${
                      activeTab === "reviews"
                        ? "text-blue-700 border-b-2 border-blue-700"
                        : "text-black hover:text-blue-700 hover:border-b-2 hover:border-blue-700"
                    }
                    `}
            >
              Reviews
            </p>
          </div>

          {/* grid 2 */}
          <div></div>
        </div>

        {/* Description  */}
        {activeTab === "description" && (
          <div className="flex flex-col gap-8 w-full lg:w-[50%] mt-10 px-4 xl:px-0">
            <h1 className="text-2xl text-black/80 font-semibold">
              Specifications:
            </h1>
            <p className="text-md text-gray-500 leading-7">
              <span className="font-bold">Lorem Ipsum</span> is simply dummy
              text of the printing and typesetting industry. Lorem Ipsum has
              been the industry's standard dummy text ever since the 1500s, when
              an unknown printer took a galley of type and scrambled it to make
              a type specimen book. It has survived not only five centuries, but
              also the leap into electronic typesetting, remaining essentially
              unchanged. It was popularised in the 1960s with the release of
              Letraset sheets containing Lorem Ipsum passages, and more recently
              with desktop publishing software like Aldus PageMaker including
              versions of Lorem Ipsum.
            </p>
          </div>
        )}

        {/* Additional Info */}
        {activeTab === "additional" && (
          <div className="flex flex-col gap-1 mt-10 bg-white rounded-md py-9 px-5">
            <div className="grid grid-cols-2 md:grid-cols-3 items-center px-6">
              <span className="text-gray-700">
                No additional information available!
              </span>
              <span className="text-gray-600"></span>
              <span></span>
            </div>
          </div>
        )}

        {/* Reviews  */}
        {activeTab === "reviews" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 px-4 xl:px-0">
            {/* Left Content  */}
            <div className="">
              <h1 className="text-2xl font-semibold text-black/80 mb-7">
                {reviewsList.length} Reviews for this product
              </h1>

              <div className="flex flex-col gap-4">
                {reviewsList.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl p-6 flex gap-5"
                  >
                    {/* Avatar */}
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      {/* Top row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {review.name}
                          </p>
                          <p className="text-sm text-gray-500">{review.role}</p>
                        </div>

                        {/* ⭐ STAR RATING (INLINE) */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={17}
                              className={
                                star <= review.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-400 fill-gray-400"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="mt-4 text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right Content  */}
            <div className="flex flex-col">
              {/* text content  */}
              <div className="">
                <h1 className="text-2xl font-semibold text-black/80 mb-3">
                  Add a Review
                </h1>
                <p>
                  Your email address will not be published. Required fields are
                  marked *
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <h1>Your Rating*</h1>

                  <div className="flex gap-1 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        onClick={() => setRating(star)}
                        className={
                          star <= rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300 fill-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment review  */}
              <div className="bg-white shadow-sm rounded-lg p-5 mt-8">
                {/* Comment */}
                <div className="flex flex-col gap-2">
                  <h1 className="font-medium">Comment</h1>

                  <textarea
                    placeholder="Your review"
                    value={comment}
                    maxLength={MAX_LENGTH}
                    onChange={(e) => setComment(e.target.value)}
                    className="
                                border border-gray-300
                                px-4 py-3 h-44 rounded-md
                                placeholder:text-gray-400
                                bg-gray-50 resize-none

                                outline-none
                                focus:outline-none
                                focus:border-blue-700/80
                                focus:border-2
                                focus:ring-3
                                focus:ring-blue-200
                                focus:ring-offset-0
                            "
                  />

                  <div className="flex justify-between items-center mt-2">
                    <h1 className="text-sm text-gray-400">Maximum</h1>

                    <div className="flex text-sm text-gray-400">
                      <span>{comment.length}</span>
                      <span>/{MAX_LENGTH}</span>
                    </div>
                  </div>
                </div>

                {/* input field  */}
                <div className="flex flex-col md:flex-row gap-7 justify-between mt-6">
                  {/* name  */}
                  <div className="flex flex-col gap-2">
                    <div className="flex">
                      <h1>Name</h1>
                      <span className="text-red-500">*</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border border-gray-200 bg-gray-100 rounded-full px-5 py-3 outline-none
                                    focus:outline-none focus:border-blue-700/80 focus:border-2
                                    focus:ring-3 focus:ring-blue-200 focus:ring-offset-0"
                    />
                  </div>

                  {/* email  */}
                  <div className="flex flex-col gap-2">
                    <div className="flex">
                      <h1>Email</h1>
                      <span className="text-red-500">*</span>
                    </div>

                    <input
                      type="email"
                      placeholder="Your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-gray-200 bg-gray-100 rounded-full px-5 py-3 outline-none
                                    focus:outline-none focus:border-blue-700/80 focus:border-2
                                    focus:ring-3 focus:ring-blue-200 focus:ring-offset-0"
                    />
                  </div>
                </div>

                {/* button  */}
                <button
                  onClick={handleSubmitReview}
                  className="text-white font-semibold text-md px-6 py-3 rounded-md
                            bg-blue-700 hover:bg-blue-800 cursor-pointer mt-6"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* recently viewed  */}
      <div className=" mt-14 px-4 xl:px-0">
        {/* Header  */}
        <div className="flex justify-between">
          <h1 className="text-[20px] md:text-3xl font-semibold text-black/80">
            Recently Viewed Products
          </h1>
          {/* button  */}
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

        {/* Body */}
        <div
          ref={carouselRef}
          className="flex gap-3 lg:gap-6 overflow-x-auto scroll-smooth select-none 
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden mt-10"
        >
          {paginatedProducts.map((item) => {
            const route = getProductRoute(item.title);
            const isInCart = cartItems.some((ci) => ci.id === item.id);

            return (
              <div
                key={item.id}
                onClick={() => router.push(route)}
                className="
                                   group relative shrink-0
                                   w-full sm:w-1/2 lg:w-1/4
                                   cursor-pointer
                               "
              >
                {/* Image */}
                <div className="bg-gray-100/80 rounded-md">
                  <Image src={item.image} alt={item.title} className="p-8" />
                </div>

                {/* Hover Buttons */}
                <div
                  className="absolute inset-x-0 bottom-24 flex items-center justify-center gap-3
                                           opacity-0 translate-y-3
                                           group-hover:opacity-100 group-hover:translate-y-0
                                           transition-all duration-300"
                  onClick={(e) => e.stopPropagation()} // 👈 VERY IMPORTANT
                >
                  <div className="bg-white rounded-full p-2 shadow">
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

                      handleAddToCart({
                        ...item,
                        desc: item.desc, // already correct
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

                {/* Title */}
                <h2 className="font-semibold mt-4 hover:text-blue-700">
                  {item.title}
                </h2>

                {/* Price */}
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
      </div>

      {/* Trend  */}
      <div className="w-full container mx-auto mt-14 mb-20 px-1 xl:px-0">
        <div className="">
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
                  Don't Miss Out Latest Trends & Offers
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
                    placeholder="Enter your email"
                    className="border-none outline-none"
                  />
                </div>
                <button className="bg-blue-700 hover:bg-blue-800 cursor-pointer text-md text-white/90 font-semibold w-full text-center px-7 py-3 rounded-full">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div
        className={`fixed inset-0 z-50 transition ${
          cartOpen ? "visible" : "invisible"
        }`}
      >
        {/* Overlay */}
        <div
          onClick={() => setCartOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            cartOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 right-0 h-full w-[550px] bg-white shadow-2xl flex flex-col px-7 py-5 animate-slide-in">
            ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Cart View</h2>
            <button
              onClick={() => setCartOpen(false)}
              className="text-gray-600 hover:text-gray-400 animate-slide-out"
            >
              <X size={22} />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-10">
            {cartItems.length === 0 ? (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gray-100 rounded-full p-8 mb-6">
                  <ShoppingCart size={30} className="text-gray-400" />
                </div>

                <p className="text-black mb-6">Your cart is empty!</p>

                <button
                  onClick={() => setCartOpen(false)}
                  className="bg-[#0d173f] text-white px-6 py-4 rounded-full w-full cursor-pointer"
                >
                  <Link href="/shop">Continue Shopping</Link>
                </button>
              </div>
            ) : (
              /* CART ITEMS */
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="bg-gray-200 rounded-lg px-1 py-2">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={100}
                          height={100}
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-[18px] text-black/80 cursor-pointer hover:text-blue-700">
                          {item.title} ({item.quantity})
                        </h3>
                        <p className="text-[15px] text-black mt-1">
                          Price: ${item.price}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="bg-gray-100 p-2 rounded-full hover:text-red-500"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-5">
            <div className="flex justify-between mb-4 text-gray-700">
              <span className="text-lg font-semibold">Subtotal:</span>
              <span className="text-lg font-semibold">
                $
                {cartItems.reduce(
                  (acc, item) => acc + item.price * item.quantity,
                  0,
                )}
              </span>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-blue-700 text-white py-3 rounded-full text-lg font-semibold">
                <Link href="/cart">View Cart</Link>
              </button>
              <button className="flex-1 bg-[#0d173f] text-white py-3 rounded-full text-lg font-semibold">
                <Link href="/checkout">Checkout</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;

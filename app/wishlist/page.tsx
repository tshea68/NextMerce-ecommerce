"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import wishlistImg from "../../public/images/wishlist.png";
import { useCart } from "@/app/context/CartContext";

const WishlistPage = () => {
  const {
    wishlistItems,
    removeFromWishlist,
    addToCart,
    cartItems,
    setCartOpen,
  } = useCart();

  const isEmpty = wishlistItems.length === 0;

  return (
    <div className="w-full container mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row mt-10 justify-between gap-2 items-start md:items-center">
        <h1 className="font-semibold text-[21px] md:text-4xl text-black/80">
          Wishlist
        </h1>

        <div className="flex gap-2 text-sm">
          <Link href="/" className="hover:text-blue-500">
            Home /
          </Link>
          <span className="text-blue-500">Wishlist</span>
        </div>
      </div>

      {/* EMPTY STATE */}
      {isEmpty && (
        <div className="bg-gray-100/90 mt-10 mb-16 w-full">
          <div className="py-24 flex items-center justify-center">
            <div className="text-center flex flex-col items-center">
              <Image src={wishlistImg} alt="Wishlist empty" className="w-28" />

              <h2 className="text-[22px] font-semibold text-black/90 mt-6">
                Your Wishlist is empty!
              </h2>

              <Link href="/shop">
                <button className="text-white font-semibold bg-blue-700 hover:bg-blue-800 py-3 px-12 mt-6 rounded-full">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WISHLIST TABLE */}
      {!isEmpty && (
        <div className="bg-white mt-10 mb-20 rounded-lg border">
          {/* horizontal scroll wrapper */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px] bg-white rounded-xl shadow-sm p-6">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b text-sm font-medium text-gray-600">
                <span></span> {/* empty header for X */}
                <p>Product</p>
                <p>Unit Price</p>
                <p>Stock Status</p>
                <p className="text-right">Action</p>
              </div>

              {/* Item    */}
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[40px_2fr_1fr_1fr_1fr] gap-4 px-6 py-6 items-center border-b last:border-b-0"
                >
                  {/* Remove */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="border rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                  >
                    <X size={14} />
                  </button>

                  {/* Product */}
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 rounded-md p-2">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={50}
                        height={50}
                      />
                    </div>
                    <p className="font-medium text-black/80">{item.title}</p>
                  </div>

                  {/* Price */}
                  <p className="font-semibold">${item.price}</p>

                  {/* Stock */}
                  <p className="text-green-600 font-medium">In Stock</p>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const isInCart = cartItems.some(
                          (ci) => ci.id === item.id,
                        );

                        if (isInCart) {
                          setCartOpen(true);
                          return;
                        }

                        addToCart({
                          id: item.id,
                          title: item.title,
                          price: item.price,
                          image: item.image,
                        });

                        setCartOpen(true);
                      }}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-full text-sm font-medium cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;

"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, Trash } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";

const page = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="mt-10">
      {/* Header  */}
      <div className="flex flex-col md:flex-row mt-10 justify-between gap-2 md:gap-0 px-2 items-start md:items-center">
        <h1 className="font-semibold text-[21px] md:text-[42px] text-black/80">
          Cart
        </h1>
        <div className="flex gap-2">
          <Link href="/">
            <p className="cursor-pointer hover:text-blue-500">Home /</p>
          </Link>
          <p className="text-blue-500">Cart</p>
        </div>
      </div>

      <hr className="mt-7" />

      {cartItems.length === 0 ? (
        /* Empty Cart Section */
        <div className="flex-1 overflow-y-auto px-6 pt-22 pb-22 text-center">
          <div className="bg-gray-100 rounded-full p-8 mb-7 mx-auto w-fit">
            <ShoppingCart size={30} className="text-gray-400" />
          </div>

          <p className="text-black mb-6 text-md">Your cart is empty!</p>

          <Link href="/shop">
            <button className="bg-[#0d173f] text-white text-md px-6 py-3.5 rounded-full font-medium w-full md:w-[30%] cursor-pointer">
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        /* Available Cart */
        <div className="bg-gray-100/80 w-full py-24 px-4 xl:px-0">
          {/* head  */}
          <div className="flex justify-between">
            <h1 className="text-3xl font-semibold text-black/80">Your Cart</h1>
            <Link href="/" className="text-blue-700 text-[16px] cursor-pointer">
              Clear Shopping Cart
            </Link>
          </div>

          {/* body */}
          <div className="mt-10">
            {/* horizontal scroll wrapper */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px] bg-white rounded-xl shadow-sm p-6">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 text-[18px] font-semibold text-gray-700 border-b pb-4">
                  <p>Product</p>
                  <p>Price</p>
                  <p>Quantity</p>
                  <p>Subtotal</p>
                  <p className="text-right">Action</p>
                </div>

                {/* Rows */}
                {cartItems.map((item) => {
                  const subtotal = item.price * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-4 items-center py-6 border-b"
                    >
                      {/* Product */}
                      <div className="flex items-center gap-4">
                        <Image
                          src={item.image}
                          className="rounded-md object-cover bg-gray-200/80 px-2 py-1"
                          alt={item.title}
                          width={60}
                          height={60}
                        />
                        <p className="font-medium text-gray-800">
                          {item.title}
                        </p>
                      </div>

                      {/* Price */}
                      <p className="font-medium">${item.price.toFixed(2)}</p>

                      {/* Quantity */}
                      <div className="inline-flex items-center h-12 w-28 border border-gray-200 rounded-full bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="w-12 h-12 flex items-center justify-center text-xl hover:text-blue-600"
                        >
                          −
                        </button>

                        <div className="w-px h-6 bg-gray-200" />

                        <span className="w-12 h-12 flex items-center justify-center font-medium">
                          {item.quantity}
                        </span>

                        <div className="w-px h-6 bg-gray-200" />

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-12 h-12 flex items-center justify-center text-xl hover:text-blue-600"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <p className="font-semibold">${subtotal.toFixed(2)}</p>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto w-10 h-10 flex items-center justify-center rounded-full border bg-gray-100 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* footer  */}
          <div className="flex flex-col lg:flex-row gap-8 mt-10">
            {/* Footer Left  */}
            <div className="w-full lg:w-[60%]">
              <div className="bg-white rounded-lg flex flex-col py-5">
                <h1 className="px-8 text-lg">Have any discount code?</h1>
                <hr className="mt-6" />
                <div className="flex gap-7 px-8 mt-6">
                  <input
                    type="text"
                    className="px-6 py-3 outline-none border border-gray-200 bg-gray-100 w-full rounded-full placeholder:text-lg placeholder:text-gray-400"
                    placeholder="Enter coupon code"
                  />

                  <button className=" rounded-full px-6 py-3 text-white font-semibold text-lg bg-blue-700 cursor-pointer hover:bg-blue-800">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Footer right  */}
            <div className="w-full lg:w-[40%]">
              <div className="bg-white rounded-lg flex flex-col py-5">
                <h1 className="px-10 text-[22px] text-black/75 font-semibold">
                  Order Summary
                </h1>
                <hr className="mt-6" />

                {/* product header  */}
                <div className="flex justify-between gap-7 px-10 mt-6">
                  <h1 className="font-semibold text-[18px] text-black/80">
                    Product
                  </h1>
                  <p className="font-semibold text-[18px] text-black/80">
                    Subtotal
                  </p>
                </div>

                <hr className="mt-5 mx-10" />

                {cartItems.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between gap-7 px-10 mt-6">
                      <h1>{item.title}</h1>
                      <p>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <hr className="mt-5 mx-10" />
                  </div>
                ))}

                <hr className="mt-5 mx-10" />

                {/* product footer  */}
                <div className="flex justify-between gap-7 px-10 mt-6">
                  <h1 className="font-semibold text-xl text-black/80">Total</h1>
                  <p className="font-semibold text-xl text-black/80">
                    ${total.toFixed(2)}
                  </p>
                </div>

                <hr className="mt-5 mx-10" />

                {/* product checkout  */}
                <div className="px-10 mt-5">
                  <Link href="/checkout">
                    <button className=" rounded-full w-full py-3 text-white text-center font-semibold text-lg bg-blue-700 cursor-pointer hover:bg-blue-800">
                      Process to Checkout
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;

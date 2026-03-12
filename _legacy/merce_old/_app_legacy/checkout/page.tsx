"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Lock,
  CreditCard,
  Smartphone,
  X,
  ArrowRightCircle,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import fedex from "../../public/images/fedex.png";
import stripe from "../../public/images/stripe.png";
import dhl from "../../public/images/dhl.png";
import cashapp from "../../public/images/cashapp.png";
import dollar from "../../public/images/dollar.png";
import amex from "../../public/images/Amex.png";
import visa from "../../public/images/visa.png";
import mastercard from "../../public/images/mastercard.png";
import Image from "next/image";
import countryList from "react-select-country-list";
import { useMemo } from "react";
// import countries from "world-countries";

const page = () => {
  const [showShipAddress, setShowShipAddress] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<
    "free" | "fedex" | "dhl"
  >("free");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cash">(
    "stripe",
  );
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [showFastCheckout, setShowFastCheckout] = useState(false);
  const [cardPaymentMethod, setCardPaymentMethod] = useState<
    "card" | "cashapp"
  >("card");

  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleChange = (e: any) => {
    let value = e.target.value.replace(/\D/g, "");

    // limit to 4 digits
    if (value.length > 4) return;

    // auto add slash
    if (value.length >= 3) {
      value = value.slice(0, 2) + " / " + value.slice(2);
    }

    setExpiry(value);

    if (value.length === 7) validateExpiry(value);
    else setError("");
  };

  const validateExpiry = (value: string) => {
    const [mm, yy] = value.split(" / ");

    const month = Number(mm);
    const year = Number("20" + yy);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) {
      setError("Invalid month");
      return;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setError("Your card’s expiration year is in the past.");
      return;
    }

    setError("");
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "") // remove non digits
      .slice(0, 16) // max 16 digits
      .replace(/(.{4})/g, "$1 ") // add space every 4
      .trim();
  };

  const countries = useMemo(() => countryList().getData(), []);
  return (
    <div>
      {/* Header  */}
      <div className="flex flex-col md:flex-row mt-10 justify-between gap-2 md:gap-0 px-2 items-start md:items-center">
        <h1 className="font-semibold text-[21px] md:text-[42px] text-black/80">
          Checkout
        </h1>
        <div className="flex gap-2">
          <Link href="/">
            <p className="cursor-pointer hover:text-blue-500">Home /</p>
          </Link>
          <p className="text-blue-500">Checkout</p>
        </div>
      </div>

      <hr className="mt-7" />

      {/* Empty Checkout Section */}
      {/* <div className="flex-1 overflow-y-auto px-6 pt-52 pb-24 text-center">
            <div className="bg-gray-100 rounded-full p-8 mb-7 mx-auto w-fit">
              <ShoppingCart size={30} className="text-gray-400" />
            </div>
                <p className="text-black mb-6 text-[22px] md:text-2xl font-semibold">No items found in your cart to checkout.</p>
                <Link href='/shop'>
                <button
                className="bg-blue-700 text-white text-md px-6 py-3.5 rounded-md  font-medium w-full md:w-[30%] cursor-pointer"
                >
                 Continue Shopping
                </button> 
                </Link>       
      </div> */}

      {/* Available checkout  */}
      <div className="bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 py-20 px-6 xl:px-0 gap-10">
          {/* Checkout Left  */}
          <div className="flex flex-col">
            <div className="mb-5">
              <h1 className="text-2xl font-semibold text-black/80">
                Billing Details
              </h1>
            </div>

            {/* Billing Details  */}
            <div className="bg-white rounded-md shadow-sm px-10 w-full py-12">
              <div className="flex gap-10 w-full justify-between">
                {/* First name  */}
                <div className="flex flex-col gap-2 flex-1">
                  <h1>
                    FirstName <span className="text-red-500">*</span>
                  </h1>
                  <div className="border border-gray-300 bg-gray-50 px-5 py-3 rounded-full focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition">
                    <input
                      type="text"
                      className="outline-none border-none placeholder:text-gray-300 w-full "
                      placeholder="John"
                    />
                  </div>
                </div>

                {/* Last Name  */}
                <div className="flex flex-col gap-2 flex-1">
                  <h1>
                    LastName <span className="text-red-500">*</span>
                  </h1>
                  <div className="border border-gray-300 bg-gray-50 px-5 py-3 w-full rounded-full focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition">
                    <input
                      type="text"
                      className="outline-none border-none placeholder:text-gray-300 w-full "
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Company Name  */}
              <div className="flex flex-col gap-2 flex-1 mt-5">
                <h1>Company Name</h1>
                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                  <input
                    type="text"
                    className="outline-none border-none placeholder:text-gray-300 w-full "
                    placeholder=""
                  />
                </div>
              </div>

              {/* Region  */}
              <div className="flex flex-col gap-2 flex-1 mt-5 ">
                <h1>
                  Region <span className="text-red-500">*</span>
                </h1>

                <select className="border border-gray-300 bg-gray-50  focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3.5 w-full rounded-full outline-none cursor-pointer">
                  <option value="">Select your region</option>
                  <option value="america">America</option>
                  <option value="england">England</option>
                  <option value="germany">Germany</option>
                  <option value="france">France</option>
                  <option value="nigeria">Nigeria</option>
                </select>
              </div>

              {/* Street Address  */}
              <div className="flex flex-col gap-2 flex-1 mt-5">
                <h1>
                  Street Address <span className="text-red-500">*</span>
                </h1>
                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                  <input
                    type="text"
                    className="outline-none border-none placeholder:text-gray-400 w-full "
                    placeholder="House number and street name "
                  />
                </div>

                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full mt-2">
                  <input
                    type="text"
                    className="outline-none border-none placeholder:text-gray-400 w-full "
                    placeholder="Apartment, suit, unit, etc. (optional)"
                  />
                </div>
              </div>

              {/* Town  */}
              <div className="flex flex-col gap-2 flex-1 mt-5">
                <h1>
                  Town/City <span className="text-red-500">*</span>
                </h1>
                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                  <input
                    type="text"
                    className="outline-none border-none placeholder:text-gray-300 w-full "
                    placeholder=""
                  />
                </div>
              </div>

              {/* Country  */}
              <div className="flex flex-col gap-2 flex-1 mt-5">
                <h1>
                  Country <span className="text-red-500">*</span>
                </h1>
                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                  <input
                    type="text"
                    className="outline-none border-none placeholder:text-gray-300 w-full "
                    placeholder=""
                  />
                </div>
              </div>

              {/* phone  */}
              <div className="flex flex-col gap-2 flex-1 mt-5">
                <h1>
                  Phone <span className="text-red-500">*</span>
                </h1>
                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                  <input
                    type="text"
                    className="outline-none border-none placeholder:text-gray-300 w-full "
                    placeholder=""
                  />
                </div>
              </div>

              {/* email  */}
              <div className="flex flex-col gap-2 flex-1 mt-5">
                <h1>
                  Email Address <span className="text-red-500">*</span>
                </h1>
                <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                  <input
                    type="email"
                    className="outline-none border-none placeholder:text-gray-300 w-full "
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            {/* Ship different address  */}
            <div
              onClick={() => setShowShipAddress(!showShipAddress)}
              className="bg-white rounded-md shadow-sm px-10 w-full py-5 mt-5 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <h1 className="text-black/80 text-lg font-semibold">
                  Ship to a different address?
                </h1>

                {showShipAddress ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {/* ship address dropdown */}
            {showShipAddress && (
              <div className="bg-white rounded-md shadow-sm px-10 w-full mt-0.5">
                {/* Region  */}
                <div className="flex flex-col gap-2 flex-1 mt-5 ">
                  <h1>
                    Country/Region <span className="text-red-500">*</span>
                  </h1>
                  <select className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3.5 w-full rounded-full outline-none cursor-pointer">
                    <option value="">Select your region</option>
                    <option value="america">America</option>
                    <option value="england">England</option>
                    <option value="germany">Germany</option>
                    <option value="france">France</option>
                    <option value="nigeria">Nigeria</option>
                  </select>
                </div>

                {/* Street Address  */}
                <div className="flex flex-col gap-2 flex-1 mt-5">
                  <h1>
                    Street Address <span className="text-red-500">*</span>
                  </h1>
                  <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                    <input
                      type="text"
                      className="outline-none border-none placeholder:text-gray-400 w-full "
                      placeholder="House number and street name "
                    />
                  </div>

                  <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full mt-2">
                    <input
                      type="text"
                      className="outline-none border-none placeholder:text-gray-400 w-full "
                      placeholder="Apartment, suit, unit, etc. (optional)"
                    />
                  </div>
                </div>

                {/* Town  */}
                <div className="flex flex-col gap-2 flex-1 mt-5">
                  <h1>
                    Town/City <span className="text-red-500">*</span>
                  </h1>
                  <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                    <input
                      type="text"
                      className="outline-none border-none placeholder:text-gray-300 w-full "
                      placeholder=""
                    />
                  </div>
                </div>

                {/* phone  */}
                <div className="flex flex-col gap-2 flex-1 mt-5">
                  <h1>
                    Phone <span className="text-red-500">*</span>
                  </h1>
                  <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                    <input
                      type="text"
                      className="outline-none border-none placeholder:text-gray-300 w-full "
                      placeholder=""
                    />
                  </div>
                </div>

                {/* email  */}
                <div className="flex flex-col gap-2 flex-1 mt-5 mb-5">
                  <h1>
                    Email Address <span className="text-red-500">*</span>
                  </h1>
                  <div className="border border-gray-300 bg-gray-50 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 w-full rounded-full">
                    <input
                      type="email"
                      className="outline-none border-none placeholder:text-gray-300 w-full "
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            )}

            {/* message */}
            <div className="bg-white rounded-md shadow-sm px-10 w-full py-5 mt-5">
              <div className="flex flex-col">
                <h1 className="text-black/80 text-lg mb-3">
                  Other Notes (optional)
                </h1>

                <textarea
                  placeholder="Notes about your order, e.g. special notes for delivery."
                  className="
                    w-full
                    h-40
                    border border-gray-300
                    bg-gray-50
                    rounded-lg
                    px-6
                    py-4
                    outline-none
                    resize-none
                    placeholder:text-gray-400
                    focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition
                  "
                />
              </div>
            </div>
          </div>

          {/* Checkout Right  */}
          <div>
            {/* Your order  */}
            <div className="bg-white rounded-lg flex flex-col py-5">
              <h1 className="px-10 text-[20px] text-black/75 font-semibold">
                Your Order
              </h1>
              <hr className="mt-6" />

              {/* product header  */}
              <div className="flex justify-between gap-7 px-10 mt-6">
                <h1 className="font-semibold text-[16px] text-black/80">
                  Product
                </h1>
                <p className="font-semibold text-[16px] text-black/80">
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
                <h1 className=" text-[15px] text-black/80">Shipping</h1>
                <p className=" text-[17px] text-black/80">$0</p>
              </div>

              <hr className="mt-5 mx-10" />

              {/* product footer  */}
              <div className="flex justify-between gap-7 px-10 mt-6">
                <h1 className="font-semibold text-[15px] text-black/80">
                  Total
                </h1>
                <p className="font-semibold text-[17px] text-black/80">
                  ${total.toFixed(2)}
                </p>
              </div>

              <hr className="mt-5 mx-10" />
            </div>

            {/* Coupon code  */}
            <div className="mt-5">
              <div className="bg-white rounded-lg flex flex-col py-5">
                <h1 className="px-8 text-[20px] text-black/80 font-semibold">
                  Have any discount code?
                </h1>
                <hr className="mt-6" />
                <div className="flex gap-7 px-8 mt-6">
                  <input
                    type="text"
                    className="px-6 py-3 outline-none border border-gray-200 bg-gray-10 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition w-full rounded-full placeholder:text-lg placeholder:text-gray-400"
                    placeholder="Enter coupon code"
                  />

                  <button className=" rounded-full px-6 py-3 text-white font-semibold text-lg bg-blue-700 cursor-pointer hover:bg-blue-800">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="mt-5">
              <div className="bg-white rounded-lg flex flex-col py-5">
                <h1 className="px-8 text-[20px] text-black/75 font-semibold">
                  Shipping Method
                </h1>

                <hr className="mt-6" />

                <div className="px-8 mt-5">
                  {/* Free Shipping */}
                  <div
                    onClick={() => setShippingMethod("free")}
                    className="flex gap-3 items-center cursor-pointer"
                  >
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center
                        ${shippingMethod === "free" ? "border-blue-700" : "border-gray-400"}
                      `}
                    >
                      {shippingMethod === "free" && (
                        <div className="h-2 w-2 bg-blue-700 rounded-full" />
                      )}
                    </div>

                    <h1>Free Shipping</h1>
                  </div>

                  {/* FedEx */}
                  <div
                    onClick={() => setShippingMethod("fedex")}
                    className="flex gap-3 items-center mt-5 cursor-pointer"
                  >
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center
                        ${shippingMethod === "fedex" ? "border-blue-700" : "border-gray-400"}
                      `}
                    >
                      {shippingMethod === "fedex" && (
                        <div className="h-2 w-2 bg-blue-700 rounded-full" />
                      )}
                    </div>

                    <div
                      className={`flex gap-3 px-5 py-2 rounded-md border
                        ${
                          shippingMethod === "fedex"
                            ? "bg-gray-100/80 border-transparent"
                            : "border-gray-200"
                        }
                      `}
                    >
                      <Image src={fedex} alt="fedex" className="w-16" />

                      <span className="border-l border-gray-200 my-2" />

                      <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-black/80 font-medium text-[17px]">
                          $10.99
                        </h1>
                        <p className="text-[11px]">Standard shipping</p>
                      </div>
                    </div>
                  </div>

                  {/* DHL */}
                  <div
                    onClick={() => setShippingMethod("dhl")}
                    className="flex gap-3 items-center mt-5 cursor-pointer"
                  >
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center
                        ${shippingMethod === "dhl" ? "border-blue-700" : "border-gray-400"}
                      `}
                    >
                      {shippingMethod === "dhl" && (
                        <div className="h-2 w-2 bg-blue-700 rounded-full" />
                      )}
                    </div>

                    <div
                      className={`flex gap-3 px-5 py-2 rounded-md border
                        ${
                          shippingMethod === "dhl"
                            ? "bg-gray-100/80 border-transparent"
                            : "border-gray-200"
                        }
                      `}
                    >
                      <Image src={dhl} alt="dhl" className="w-16" />

                      <span className="border-l border-gray-200 my-2" />

                      <div className="flex flex-col justify-center gap-1">
                        <h1 className="text-black/80 font-medium text-[17px]">
                          $12.99
                        </h1>
                        <p className="text-[11px]">Standard shipping</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method  */}
            <div className="mt-5">
              <div className="bg-white rounded-lg flex flex-col py-5">
                <h1 className="px-8 text-[20px] text-black/75 font-semibold">
                  Payment Method
                </h1>
                <hr className="mt-6" />
                <div className="px-8 mt-5">
                  {/* Payment  */}
                  <div className="">
                    {/* Stripe */}
                    <div
                      onClick={() => setPaymentMethod("stripe")}
                      className="flex gap-3 items-center mt-5 cursor-pointer"
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center
                          ${paymentMethod === "stripe" ? "border-blue-700" : "border-gray-400"}
                        `}
                      >
                        {paymentMethod === "stripe" && (
                          <div className="h-2 w-2 bg-blue-700 rounded-full" />
                        )}
                      </div>

                      <div
                        className={`flex gap-3 px-5 py-0.5 rounded-md border w-60
                          ${
                            paymentMethod === "stripe"
                              ? "bg-gray-100/80 border-transparent"
                              : "border-gray-200"
                          }
                        `}
                      >
                        <Image src={stripe} alt="fedex" className="w-14" />

                        <span className="border-l border-gray-200 my-2" />

                        <div className="flex flex-col justify-center gap-1">
                          <p className="">Stripe</p>
                        </div>
                      </div>
                    </div>

                    {/* cashon delivery */}
                    <div
                      onClick={() => setPaymentMethod("cash")}
                      className="flex gap-3 items-center mt-5 cursor-pointer"
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center
                          ${paymentMethod === "cash" ? "border-blue-700" : "border-gray-400"}
                        `}
                      >
                        {paymentMethod === "cash" && (
                          <div className="h-2 w-2 bg-blue-700 rounded-full" />
                        )}
                      </div>

                      <div
                        className={`flex gap-3 px-5 py-2 rounded-md border w-60
                          ${
                            paymentMethod === "cash"
                              ? "bg-gray-100/80 border-transparent"
                              : "border-gray-200"
                          }
                        `}
                      >
                        <Image src={dollar} alt="dhl" className="w-10" />

                        <span className="border-l border-gray-200 my-2" />

                        <div className="flex flex-col justify-center gap-1">
                          <p className="">Cash on Delivery</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === "stripe" && (
                    <div>
                      {/* Card payment  */}
                      <div>
                        <div className="flex gap-4 mt-5">
                          {/* CARD */}
                          <div
                            onClick={() => setCardPaymentMethod("card")}
                            className={`flex flex-col flex-1 gap-1 px-5 py-2 rounded-md cursor-pointer transition
                          ${
                            cardPaymentMethod === "card"
                              ? "border-[1.5px] border-blue-700 ring-[1.5px] ring-blue-200 bg-white"
                              : "border border-gray-200 bg-gray-100/80"
                          }
                        `}
                          >
                            <CreditCard
                              size={18}
                              className={
                                cardPaymentMethod === "card"
                                  ? "text-blue-700"
                                  : "text-gray-500"
                              }
                            />

                            <h1
                              className={`text-sm ${
                                cardPaymentMethod === "card"
                                  ? "text-blue-700"
                                  : "text-gray-500"
                              }`}
                            >
                              Card
                            </h1>
                          </div>

                          {/* CASH APP */}
                          <div
                            onClick={() => setCardPaymentMethod("cashapp")}
                            className={`flex flex-col flex-1 px-5 py-2 rounded-md cursor-pointer transition
                          ${
                            cardPaymentMethod === "cashapp"
                              ? "border-[1.5px] border-blue-700 ring-[1.5px] ring-blue-200 bg-gray-100/80"
                              : "border border-gray-200 bg-gray-100/80"
                          }
                        `}
                          >
                            <Image
                              src={cashapp}
                              className="w-6"
                              alt="cashapp"
                            />

                            <h1
                              className={`text-sm ${
                                cardPaymentMethod === "cashapp"
                                  ? "text-blue-700"
                                  : "text-gray-500"
                              }`}
                            >
                              Cash App Pay
                            </h1>
                          </div>
                        </div>

                        {/* card active  */}
                        {cardPaymentMethod === "card" && (
                          <div>
                            {/* fast checkout */}
                            <div>
                              {!showFastCheckout && (
                                <div
                                  className="flex flex-col mt-5 cursor-pointer"
                                  onClick={() => setShowFastCheckout(true)}
                                >
                                  <div className="flex gap-1 items-center">
                                    <Lock
                                      size={17}
                                      className="text-green-500 mr-2"
                                    />
                                    <p className="text-blue-700 font-medium">
                                      Secure fast checkout with Link
                                    </p>
                                    <ChevronDown
                                      size={18}
                                      className="text-blue-700"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* fast checkout dropdown */}
                              {showFastCheckout && (
                                <div className="flex flex-col px-2 py-3 rounded-md border mt-5">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      <Lock
                                        size={17}
                                        className="text-green-500 mr-2"
                                      />
                                      <p className="font-medium">
                                        Secure fast checkout with Link
                                      </p>
                                    </div>

                                    {/* X button */}
                                    <X
                                      size={14}
                                      className="cursor-pointer"
                                      onClick={() => setShowFastCheckout(false)}
                                    />
                                  </div>

                                  <h1 className="text-sm mt-1">
                                    Securely pay with your saved info, or create
                                    a Link account for faster checkout next time
                                  </h1>

                                  <hr className="mt-3 text-gray-100" />

                                  <div className="flex flex-col mt-3 flex-1">
                                    <h1>Email</h1>

                                    <div className="flex justify-between items-center border border-gray-300 rounded-md px-5 py-3 mt-2">
                                      <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="outline-none border-none w-full"
                                      />
                                    </div>
                                  </div>

                                  <hr className="mt-3 text-gray-200" />

                                  <div className="flex items-center gap-1 mt-3">
                                    <ArrowRightCircle
                                      size={16}
                                      className="text-gray-400"
                                    />
                                    <h1 className="text-gray-400 font-bold text-md">
                                      link
                                    </h1>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col mt-5">
                              <h1>Card Number</h1>
                              <div className="flex justify-between items-center border border-gray-200  shadow-sm rounded-md px-5 py-3 mt-2  focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="1234 1234 1234 1234"
                                  value={cardNumber}
                                  onChange={(e) =>
                                    setCardNumber(
                                      formatCardNumber(e.target.value),
                                    )
                                  }
                                  className="outline-none border-none w-full"
                                />

                                <div className="flex ">
                                  <Image
                                    src={visa}
                                    alt="visa"
                                    className="w-7"
                                  />
                                  <Image
                                    src={mastercard}
                                    alt="mastercard"
                                    className="w-12"
                                  />
                                  <Image
                                    src={amex}
                                    alt="amex"
                                    className="w-8"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              {/* expiration date  */}
                              <div className="flex flex-col mt-5 flex-1">
                                <h1>Expiration (MM/YY)</h1>

                                <div
                                  className={`flex items-center border rounded-md focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition px-5 py-3 mt-2 ${
                                    error ? "border-red-500" : "border-gray-300"
                                  }`}
                                >
                                  <input
                                    value={expiry}
                                    onChange={handleChange}
                                    placeholder="MM / YY"
                                    className="outline-none border-none w-full"
                                  />
                                </div>

                                {error && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {error}
                                  </p>
                                )}
                              </div>

                              {/* security code  */}
                              <div className="flex flex-col mt-5 flex-1">
                                <h1>Security code</h1>
                                <div className="flex justify-between items-center border border-gray-300 rounded-md px-5 py-3 mt-2 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={3}
                                    placeholder="CVC"
                                    onChange={(e) =>
                                      (e.target.value = e.target.value.replace(
                                        /\D/g,
                                        "",
                                      ))
                                    }
                                    className="outline-none border-none w-full"
                                  />
                                  <CreditCard className="text-gray-400" />
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col mt-5">
                              <h1>Country</h1>
                              <select className="border border-gray-300 px-5 py-3 w-full rounded-md outline-none mt-2 focus-within:border-[1.5px] focus-within:border-blue-700 focus-within:ring-[1.5px] focus-within:ring-blue-200 transition">
                                <option value="">Select your country</option>

                                {countries.map((country) => (
                                  <option
                                    key={country.value}
                                    value={country.label}
                                  >
                                    {country.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* cash app active  */}
                        {cardPaymentMethod === "cashapp" && (
                          <div className="flex flex-col px-2 py-3 rounded-md border border-gray-400 mt-5">
                            <Image
                              src={cashapp}
                              className="w-12"
                              alt="cashapp"
                            />

                            <h1 className=" font-medium">
                              Cash App Pay selected
                            </h1>

                            <hr className="mt-3" />

                            <div className="mt-3 flex gap-4 items-center">
                              <Smartphone size={30} className="text-gray-400" />
                              <h1 className="text-gray-400 text-sm">
                                You will be shown a QR code to scan using Cash
                                App.
                              </h1>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* cashon delivery dropdown  */}
                  {paymentMethod === "cash" && (
                    <div className="mt-5">
                      <h1 className="text-green-600">
                        You have selected Cash on Delivery. Your order will be
                        processed and payment will be collected upon delivery.
                      </h1>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pay total  */}
            <div className="bg-blue-700 rounded-full py-3 px-5 text-center hover:bg-blue-800 text-white mt-5 cursor-pointer font-semibold">
              Pay ${total.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;

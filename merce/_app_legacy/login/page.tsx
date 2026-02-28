"use client";

import React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import github from "../../public/images/github logo.png";
import google from "../../public/images/google_icon.png";

const page = () => {
  return (
    <div className="">
      {/* Header  */}
      <div className="flex flex-col md:flex-row mt-10 justify-between gap-2 md:gap-0 px-2 items-start md:items-center">
        <h1 className="font-semibold text-[21px] md:text-4xl text-black/80">
          Sign Up
        </h1>
        <div className="flex gap-2">
          <Link href="/">
            <p className="cursor-pointer hover:text-blue-500">Home /</p>
          </Link>
          <p className="text-blue-500">Signup </p>
        </div>
      </div>

      {/* Body  */}
      <div className="bg-gray-100/90 mt-10 mb-16 w-full">
        <div className="py-16 md:py-6 items-center justify-center flex mx-auto px-4">
          <div className="bg-white rounded-md w-full md:w-[40%] py-7 flex items-center">
            {/* Content  */}
            <div className="flex flex-col w-full mx-5 md:mx-10">
              {/* subhead  */}
              <div className="items-center justify-center text-center">
                <h1 className="text-[26px] text-black/80 font-semibold">
                  Create an Account
                </h1>
                <p className="mt-2 text-md">Enter your detail below</p>
              </div>

              {/* Google and github  */}
              <div className="flex items-center text-center gap-2 justify-center border mt-10 py-3 rounded-full bg-gray-50 hover:bg-gray-100/90 cursor-pointer">
                <Image src={google} alt="google" className="w-5" />
                <p>Sign Up with Google</p>
              </div>
              <div className="flex items-center text-center justify-center border mt-5 py-3 rounded-full gap-2 bg-gray-50 hover:bg-gray-100/90 cursor-pointer">
                <Image src={github} alt="github" className="w-5" />
                <p>Sign Up with GitHub</p>
              </div>

              <div className="flex mt-4">
                <hr className="w-[50%] mt-3.5" />
                <p className="mx-2 font-semibold text-[16px]">Or</p>
                <hr className="w-[50%] mt-3.5" />
              </div>

              {/* name  */}
              <div className="w-full mt-8">
                <h1>
                  Full Name <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50 
                  focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                >
                  <input
                    type="text"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="john"
                  />
                </div>
              </div>

              {/* mail  */}
              <div className="w-full mt-8">
                <h1>
                  Email Address <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50 
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                >
                  <input
                    type="email"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="john@gmail.com"
                  />
                </div>
              </div>

              {/* password  */}
              <div className="w-full mt-8">
                <h1>
                  Password <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50 
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                >
                  <input
                    type="password"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="Enter Your Password"
                  />
                </div>
              </div>

              {/* mail  */}
              <div className="w-full mt-8">
                <h1>
                  Re-Type Password <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50 
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                >
                  <input
                    type="password"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="Re-Type Your Password"
                  />
                </div>
              </div>

              {/* Button  */}
              <div className="bg-blue-950 hover:bg-blue-700 cursor-pointer text-white text-center font-semibold rounded-full w-full py-3 mt-8">
                Create Account
              </div>

              {/* forgot password  */}
              <div className="flex flex-col mt-3">
                <div className="flex items-center text-center justify-center mt-5 gap-1 mb-6">
                  <p>Already have an account?</p>
                  <Link href="../register">
                    <span className="hover:text-blue-500 cursor-pointer">
                      Sign in Now!
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;

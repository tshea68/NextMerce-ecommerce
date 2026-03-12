import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  Twitter,
  LinkedinIcon,
} from "lucide-react";
import Image from "next/image";
import apple from "../../../public/images/apple.png";
import playstore from "../../../public/images/playstore.png";
import pay1 from "../../../public/images/pay1.png";
import pay2 from "../../../public/images/pay2.png";
import pay3 from "../../../public/images/pay3.png";
import pay4 from "../../../public/images/pay4.png";
import pay5 from "../../../public/images/pay5.png";
import pay11 from "../../../public/images/pay11.jpg";

const Footer = () => {
  return (
    <div className="w-full container mx-auto mt-10">
      <div className="mx-5 xl:mx-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8 md:gap-0 ">
        {/* Support  */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[22px] font-semibold text-blue-950 mb-2">
            Help & Support
          </h1>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <MapPin className="text-blue-500" size={16} />
              <p>685 Market Street,Las Vegas, LA 95820,United States.</p>
            </div>
            <div className="flex gap-3 items-center">
              <Phone className="text-blue-500" size={16} />
              <p>(+234)704-577-1682</p>
            </div>
            <div className="flex gap-3 items-center">
              <Mail className="text-blue-500" size={16} />
              <p>support@example.com</p>
            </div>
          </div>

          {/* socials  */}
          <div className="flex gap-3 items-center mt-4">
            <FacebookIcon size={20} className="" />
            <Twitter size={20} />
            <InstagramIcon size={20} />
            <LinkedinIcon size={20} />
          </div>
        </div>

        {/* Account  */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[22px] font-semibold text-blue-950 mb-2">
            Account
          </h1>
          <p className="hover:text-blue-500 cursor-pointer">Login / Register</p>
          <p className="hover:text-blue-500 cursor-pointer">Cart</p>
          <p className="hover:text-blue-500 cursor-pointer">Wishlist</p>
          <p className="hover:text-blue-500 cursor-pointer">Shop</p>
        </div>

        {/* QuickLink  */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[22px] font-semibold text-blue-950 mb-2">
            Quick Link
          </h1>
          <p className="hover:text-blue-500 cursor-pointer">Privacy Policy</p>
          <p className="hover:text-blue-500 cursor-pointer">Refund Policy</p>
          <p className="hover:text-blue-500 cursor-pointer">Terms of Use</p>
          <p className="hover:text-blue-500 cursor-pointer">FAQ's</p>
          <p className="hover:text-blue-500 cursor-pointer">Contact</p>
        </div>

        {/* Download  */}
        <div className="flex flex-col items-start lg:items-end gap-4">
          <h1 className="text-left md:text-right text-[22px] mb-2 font-semibold text-blue-950">
            Download App
          </h1>
          <p className="text-left md:text-right text-[15px] font-light">
            Save $3 With App & New User only
          </p>

          {/* Apple Button */}
          <div className="bg-blue-950 flex items-center gap-3 w-[60%] rounded-md px-4 py-3">
            <Image alt="apple" src={apple} className="w-9 h-9" />
            <div className="flex flex-col text-white ">
              <span className="text-[10px]">Download on the</span>
              <span className="font-semibold text-sm">App Store</span>
            </div>
          </div>

          {/* Playstore Button */}
          <div className="bg-blue-700/80 flex items-center gap-3 w-[60%] rounded-md px-4 py-3">
            <Image alt="playstore" src={playstore} className="w-10 h-10" />
            <div className="flex flex-col text-white ">
              <span className="text-[10px]">Get it on</span>
              <span className="font-semibold text-sm">Google Play</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row mt-10 items-center justify-between bg-gray-100 px-3 xl:px-0 py-4 gap-3 md:gap-10">
        <p className="text-gray-600 text-sm">
          © 2025. All rights reserved by{" "}
          <span className="text-black text-sm">Michael.</span>
        </p>
        <div className="flex items-center gap-4 ">
          <h1 className="text-sm font-semibold text-gray-500">We Accept:</h1>
          <Image src={pay1} alt="Pay1" className="w-7" />
          <Image src={pay2} alt="Pay2" className="w-8" />
          <Image src={pay3} alt="Pay3" className="w-14" />
          <Image src={pay4} alt="Pay4" className="w-14" />
          <Image src={pay5} alt="Pay5" className="w-14" />
        </div>
      </div>
    </div>
  );
};

export default Footer;

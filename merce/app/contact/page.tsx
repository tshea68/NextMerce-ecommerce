import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

const page = () => {
  return (
    <div className="mb-10">
      {/* Header  */}
      <div className="flex flex-col md:flex-row mt-10 mb-7 justify-between gap-2 md:gap-0 px-2 items-start md:items-center">
        <h1 className="font-semibold text-[21px] md:text-[40px] text-black/70">
          Contact
        </h1>
        <div className="flex gap-2">
          <Link href="/">
            <p className="cursor-pointer hover:text-blue-500">Home /</p>
          </Link>
          <p className="text-blue-500">Contact</p>
        </div>
      </div>

      <div className="bg-gray-100/90 flex items-center justify-center px-4 xl:px-0 mb-20 md:mb-32">
        <div className="flex flex-col md:flex-row gap-8 w-full mt-14 mb-14">
          {/* left content  */}
          <div className="flex flex-col bg-white rounded-lg w-full md:w-[30%]">
            <div className="my-5 ">
              <h1 className="font-medium text-xl px-7 text-black/80">
                Contact Information
              </h1>
              <hr className="mt-4" />
            </div>

            {/* Contact  */}
            <div className="flex flex-col px-7 gap-5 mt-2 pb-5">
              <div className="flex gap-4 items-center">
                <Mail className="text-blue-600" size={20} />
                Email: jamse@example.com
              </div>
              <div className="flex gap-4 items-center">
                <Phone className="text-blue-600" size={20} />
                Phone: 1234567890
              </div>
              <div className="flex gap-4 items-center">
                <MapPin className="text-blue-600" size={28} />
                Address: 7398 Smoke Ranch RoadLas Vegas, Nevada 89128
              </div>
            </div>
          </div>

          {/* right content */}
          <div className="bg-white rounded-lg w-full md:w-[70%] px-4 md:px-10 pt-10 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
              {/* First Name */}
              <div className="w-full">
                <h1>
                  First Name <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50
                focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <input
                    type="text"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="John"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="w-full ">
                <h1>
                  Last Name <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50
                focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <input
                    type="text"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="Deo"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="w-full ">
                <h1>
                  Subject <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50
                focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <input
                    type="text"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="Type your subject"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="w-full ">
                <h1>
                  Phone <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-3 mt-2 rounded-full bg-gray-50
                focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <input
                    type="text"
                    className="border-none outline-none bg-transparent w-full"
                    placeholder="Enter your phone"
                  />
                </div>
              </div>

              {/* MESSAGE — FULL WIDTH */}
              <div className="w-full md:col-span-2">
                <h1>
                  Message <span className="text-red-500">*</span>
                </h1>
                <div
                  className="border px-6 py-4 mt-2 rounded-md bg-gray-50
                focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <textarea
                    placeholder="Type your message"
                    className="border-none outline-none bg-transparent w-full
                            min-h-[180px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Button */}
            <div
              className="bg-blue-700 hover:bg-blue-800 cursor-pointer text-white
                          text-center font-semibold rounded-full
                          w-fit px-10 py-3 mt-10"
            >
              Send Message
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;

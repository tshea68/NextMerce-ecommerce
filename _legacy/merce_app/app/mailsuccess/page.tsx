import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const page = () => {
  return (
    <div className="bg-gray-100/90  flex items-center justify-center px-4 md:px-10 lg:px-20">
      {/* WHITE CARD */}
      <div className="bg-white w-full max-w-9xl rounded-xl shadow-sm mt-24 mb-24 py-14 md:py-24 px-6 text-center">
        <h1 className="text-2xl md:text-5xl font-extrabold text-blue-700/90 leading-none">
          Successful!
        </h1>

        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Your message sent successfully
        </h2>

        <p className="mt-4 text-black max-w-md mx-auto">
          Thank you so much for your message. We check e-mail frequently and
          will try our best to respond to your inquiry.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-10 px-8 py-3 rounded-full
                     bg-blue-700 text-white font-medium hover:bg-blue-800 cursor-pointer transition"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default page;

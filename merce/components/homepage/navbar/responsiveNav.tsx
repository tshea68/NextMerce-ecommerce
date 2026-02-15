"use client";

import React from "react";
import MobileNav from "./MobileNav";
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { ChevronUp } from "lucide-react";

const ResponsiveNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ✅ Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div>
        <header className="w-full">
          {/* Show mobile nav on small screens */}
          <div className="block md:hidden">
            <MobileNav />
          </div>

          {/* Show desktop nav on md and up */}
          <div className="hidden md:block">
            <Navbar />
          </div>
        </header>
      </div>

      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 bg-blue-700 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-9999"
        >
          <ChevronUp size={18} />
        </button>
      )}
    </>
  );
};

export default ResponsiveNav;

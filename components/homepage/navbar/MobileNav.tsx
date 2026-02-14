"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/images/logg.png";
import {
  Menu,
  X,
  Heart,
  ShoppingCart,
  Search,
  User,
  ChevronDown,
  ChevronUp,
  Star,
  Trash,
} from "lucide-react";
import product1 from "../../../public/images/console.png";
import product2 from "../../../public/images/newarrival3.png";
import product3 from "../../../public/images/newarrival1.png";
import product4 from "../../../public/images/newarrival7.png";
import product5 from "../../../public/images/newarrival4.png";
import product6 from "../../../public/images/newarrival2.png";
import product7 from "../../../public/images/newarrival6.png";
import product8 from "../../../public/images/newarrival5.png";
import product9 from "../../../public/images/newarrival8.png";
import blog1 from "../../../public/images/blog1.jpg";
import blog2 from "../../../public/images/blog2.jpg";
import blog3 from "../../../public/images/blog3.jpg";
import blog4 from "../../../public/images/blog4.jpg";
import blog5 from "../../../public/images/blog5.jpg";
import blog6 from "../../../public/images/blog6.jpg";
import blog7 from "../../../public/images/blog7.jpg";
import blog8 from "../../../public/images/blog8.jpg";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";

const MobileNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  // const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [newQuery, setNewQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [blogsOpen, setBlogsOpen] = useState(false);
  const { cartItems, cartOpen, setCartOpen, removeFromCart } = useCart();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Sample data (replace with your API or fetched data)
  const products = [
    {
      name: "Havit HV-G69 USD Gamepad",
      price: "$26",
      oldPrice: "$54",
      image: product1,
    },
    {
      name: "Rangs 43 Inch Frameless FHD Double Glass Android TV",
      price: "$700",
      oldPrice: "$800",
      image: product2,
    },
    {
      name: "Portable Electric Grinder Maker",
      price: "$777",
      oldPrice: "$888",
      image: product3,
    },
    {
      name: "MacBook Air M4 chip, 16/256GB",
      price: "$600",
      oldPrice: "$699",
      image: product4,
    },
    {
      name: "iPhone 16 Pro Max",
      price: "$899",
      oldPrice: "$940",
      image: product5,
    },
    {
      name: "iPhone 16 Pro 8/128GB",
      price: "$600",
      oldPrice: "$799",
      image: product5,
    },
    {
      name: "Indoor Steel Adjustable Silent Treadmill Home Fitness",
      price: "$888",
      oldPrice: "$999",
      image: product6,
    },
    {
      name: "Apple Watch Ultra",
      price: "$89",
      oldPrice: "$99",
      image: product7,
    },
    {
      name: "Apple iPad Pro",
      price: "$700",
      oldPrice: "$800",
      image: product8,
    },
    {
      name: "Apple iMac M4 24-inch 2025",
      price: "$999",
      oldPrice: "$1100",
      image: product9,
    },
  ];

  const blogs = [
    {
      slug: "ultimate",
      name: "The Ultimate Guide to Traveling on a Budget",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog1,
    },
    {
      slug: "psychology",
      name: "The Psychology of Happiness: Finding Joy in Everyday Life",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog2,
    },
    {
      slug: "benefit",
      name: "The Benefits of Regular Exercise for a Healthy Lifestyle",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog3,
    },
    {
      slug: "techtrends",
      name: "Tech Trends 2022: What's Changing in the Digital World",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog4,
    },
    {
      slug: "ecommerce",
      name: "How to Start a Successful E-commerce Business",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog5,
    },
    {
      slug: "exploring",
      name: "Exploring the Wonders of Modern Art: A Gallery Tour",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog6,
    },
    {
      slug: "masterclass",
      name: "Masterclass: Creating Delicious Italian Pasta",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog7,
    },
    {
      slug: "guide",
      name: "A Guide to Sustainable Living: Reduce, Reuse, Recycle",
      desc: "In the world of web development staying ahead of the curve is crucial.",
      image: blog8,
    },
  ];

  const pagesRoutes = [
    { label: "Shop With Sidebar", path: "/shop" },
    { label: "Shop Without Sidebar", path: "/popular" },
    { label: "Checkout", path: "/checkout" },
    { label: "Cart", path: "/cart" },
    { label: "Wishlist", path: "/wishlist" },
    { label: "Sign in", path: "/register" },
    { label: "Sign up", path: "/login" },
    { label: "Contact", path: "/contact" },
    { label: "Error", path: "/error" },
    { label: "Mail Success", path: "/mailsuccess" },
  ];

  const blogRoutes = [
    { label: "Blog Grid With Sidebar", path: "/blogs/bloggridside" },
    { label: "Blog Grid", path: "/blogs/bloggrid" },
    { label: "Blog Details With Sidebar", path: "/blogs/blogdetailside" },
    { label: "Blog Details", path: "/blogs/blogdetails" },
  ];

  const { wishlistItems } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // effect to use esc to close cart
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
      }
    };

    if (cartOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [cartOpen]);

  // for routing different product
  const router = useRouter();

  // ---------- Place this AFTER your `products` and `blogs` arrays and BEFORE you use it ----------

  // Escapes user input so it is safe to put into a RegExp
  const escapeRegExp = (s: string): string =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Highlight matches (typed and lint-friendly).
  // NOTE: parameter name `q` avoids shadowing component state like `newQuery`.
  const highlightText = (text: string, q: string): string => {
    if (!q) return text; // nothing to highlight
    const escaped = escapeRegExp(q); // escape special regex chars
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, `<mark class="bg-yellow-200">$1</mark>`);
  };

  const filteredProducts = (products || []).filter((p) =>
    p.name.toLowerCase().includes(newQuery.toLowerCase()),
  );

  const filteredBlogs = (blogs || []).filter((b) =>
    b.name.toLowerCase().includes(newQuery.toLowerCase()),
  );

  const categories = [
    "Laptop & PC",
    "Watches",
    "Mobile & Tablets",
    "Health & Sports",
    "Home Appliances",
    "Games & Videos",
    "Televisions",
  ];

  const makeSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/ & /g, "-") // Handles "Laptop & PC"
      .replace(/\s+/g, "-") // Space → hyphen
      .replace(/-+/g, "-") // Remove duplicate hyphens
      .trim();

  const pathname = usePathname();

  const isBlogActive = pathname.startsWith("/blogs");

  const activeCategory = (() => {
    const parts = pathname.split("/");

    if (parts[1] === "categories" && parts[2]) {
      const currentSlug = parts[2];

      return categories.find((item) => makeSlug(item) === currentSlug);
    }

    return null;
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Route for product listing
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
    if (t.includes("watch")) return "/product/applewatch";
    if (t.includes("grinder")) return "/product/grinder";

    return "/product";
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50
        transition-all duration-300 flex flex-col h-[180px] md:h-auto
        ${scrolled ? "bg-white shadow-md" : "bg-transparent"}
      `}
    >
      <div
        className="
          w-full
          px-4 py-3
          flex flex-col gap-4
          xl:max-w-7xl xl:mx-auto
          xl:flex-row xl:items-center xl:justify-between xl:gap-0
        "
      >
        {/* === TOP ROW: Logo, Category, Search === */}
        <div className="flex items-center justify-between w-full xl:w-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logo}
              alt="NextMerce"
              width={130}
              className="object-contain"
            />
          </Link>
        </div>

        {/* === MIDDLE ROW: Category + Search === */}
        <div className="flex items-center w-full gap-3 mt-2 xl:mt-0">
          {/* All Categories Dropdown */}
          <div ref={dropdownRef} className="relative w-[40%] ">
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center justify-center gap-2 border py-2.5 cursor-pointer bg-gray-50 rounded-full transition text-sm px-2 w-full hover:bg-gray-100"
            >
              {/* <Menu size={17} /> */}
              <span className="text-[12px]">All Categories</span>
              {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </div>

            {/* Dropdown List */}
            {open && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white shadow-lg rounded-xl overflow-hidden z-50">
                <ul className="flex flex-col text-sm text-gray-700">
                  {categories.map((item) => {
                    const slug = makeSlug(item); // ✅ Added this

                    return (
                      <Link href={`/categories/${slug}`} key={item}>
                        <li className="px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-black hover:rounded-md mx-2 transition-colors cursor-pointer">
                          {item}
                        </li>
                      </Link>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="relative mx-auto">
            <div
              onClick={() => setSearchOpen(true)}
              className="flex items-center  border  py-2 px-4 bg-gray-50 rounded-full w-full"
            >
              <input
                type="text"
                className="outline-none border-none text-gray-600 text-[16px] placeholder:text-gray-500/80"
                placeholder="I am shopping for..."
              />
              <Search size={17} className="text-gray-400" />
            </div>

            {/* Popup / Modal */}
            {searchOpen && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                {/* Wrapper for the modal and the floating button */}
                <div className="relative w-full">
                  {/* White modal box */}

                  <div className="bg-white rounded-2xl shadow-xl mx-5 md:w-[900px] h-[90vh] overflow-y-auto my-10">
                    <div className="px-10 pt-10 pb-4">
                      {/* Modal content */}
                      <div className="flex items-center border px-4 py-[15px] rounded-lg mb-4">
                        <Search size={17} className="text-gray-600" />
                        <input
                          type="text"
                          value={newQuery}
                          onChange={(e) => setNewQuery(e.target.value)}
                          className="ml-2 flex-1 outline-none bg-transparent"
                          placeholder="Type anything to search..."
                        />
                      </div>

                      {/* Tabs */}
                      <div className="flex gap-3 mb-4 mt-10">
                        {["all", "products", "blogs"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-md font-semibold border transition-all duration-200 ${
                              activeTab === tab
                                ? "bg-blue-100 text-blue-700 border-blue-700"
                                : "border-gray-400 text-black hover:bg-blue-100 hover:border-blue-700"
                            }`}
                          >
                            {tab === "all"
                              ? "All"
                              : tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product list */}
                    <hr className="w-full mb-12" />

                    <div className="space-y-3 px-10">
                      {/* PRODUCTS SECTION */}
                      {(activeTab === "all" || activeTab === "products") && (
                        <>
                          <h3 className="text-[20px] text-black/80 font-bold mb-4">
                            Products
                          </h3>

                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p, i) => {
                              const route = getProductRoute(p.name); // ✅ same routing logic

                              return (
                                <div
                                  key={i}
                                  onClick={() => {
                                    router.push(route); // ✅ navigate correctly
                                    setSearchOpen(false); // ✅ close mobile nav/search
                                  }}
                                  className="flex items-center gap-4 p-1 hover:bg-gray-100 
                                                  group cursor-pointer rounded-lg"
                                >
                                  <Image
                                    src={p.image}
                                    alt={p.name}
                                    className="w-24 border border-gray-200 
                                                    rounded-md object-cover bg-gray-100"
                                  />

                                  <div className="flex-1">
                                    <h4
                                      className="text-gray-800 group-hover:text-blue-700 
                                                      font-semibold text-md"
                                      dangerouslySetInnerHTML={{
                                        __html: highlightText(p.name, newQuery),
                                      }}
                                    />

                                    <div className="text-sm text-gray-500 flex gap-2 items-center">
                                      <span className="text-black text-[16px]">
                                        {p.price}
                                      </span>
                                      <span className="line-through text-[16px]">
                                        {p.oldPrice}
                                      </span>

                                      <div className="flex items-center gap-1 ml-2">
                                        <Star
                                          size={17}
                                          className="fill-gray-300 text-gray-300"
                                        />
                                        <Star
                                          size={17}
                                          className="fill-gray-300 text-gray-300"
                                        />
                                        <Star
                                          size={17}
                                          className="fill-gray-300 text-gray-300"
                                        />
                                        <Star
                                          size={17}
                                          className="fill-gray-300 text-gray-300"
                                        />
                                        <Star
                                          size={17}
                                          className="fill-gray-300 text-gray-300"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 italic">
                              No matching products found.
                            </p>
                          )}
                        </>
                      )}

                      {/* BLOGS SECTION */}
                      {(activeTab === "all" || activeTab === "blogs") && (
                        <>
                          <h3 className="text-[20px] mt-8 mb-5 text-black/80 font-bold">
                            Blogs
                          </h3>
                          {filteredBlogs.length > 0 ? (
                            filteredBlogs.map((b, i) => (
                              <Link
                                key={b.slug}
                                href={`/blogs/${b.slug}`}
                                onClick={() => setSearchOpen(false)}
                                className="block"
                              >
                                <div
                                  key={i}
                                  className="flex items-center gap-4 p-3 hover:bg-gray-100 group cursor-pointer rounded-lg"
                                >
                                  <Image
                                    src={b.image}
                                    alt={b.name}
                                    className="w-20 h-14 rounded-md object-cover"
                                  />
                                  <div className="flex flex-col gap-1">
                                    <h4
                                      className="text-gray-800 group-hover:text-blue-700 font-semibold text-[16px]"
                                      dangerouslySetInnerHTML={{
                                        __html: highlightText(b.name, newQuery),
                                      }}
                                    />
                                    <p
                                      className="text-[12px]"
                                      dangerouslySetInnerHTML={{
                                        __html: highlightText(b.desc, newQuery),
                                      }}
                                    />
                                  </div>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <p className="text-gray-500 italic">
                              No matching blogs found.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Floating X Button */}
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="absolute top-6 right-0 bg-white border-2 border-gray-300 text-gray-600 
                                        hover:border-gray-500 hover:text-gray-800 
                                        w-10 h-10 flex items-center justify-center rounded-full shadow-lg 
                                        transition-all duration-200 z-10"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right icons for mobile */}
        <div className="flex justify-between items-center gap-4 mt-3 xl:hidden">
          <div className="flex items-center justify-center gap-4">
            <Link href="/wishlist">
              <div className="relative inline-flex items-center cursor-pointer">
                <Heart size={22} />

                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              </div>
            </Link>

            {/* Shopping cart    */}
            <div
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center cursor-pointer"
            >
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            {/* 🧾 Cart Sidebar */}
            {cartOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-50"
                onClick={() => setCartOpen(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-0 right-0 h-full w-[90%] md:w-[500px] bg-white shadow-2xl flex flex-col px-7 py-5 animate-slide-in"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center border-b py-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      Cart View
                    </h2>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="text-gray-600 hover:text-gray-400 animate-slide-out"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pt-10">
                    {cartItems.length === 0 ? (
                      /* EMPTY CART */
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-full p-8 mb-7 mx-auto w-fit">
                          <ShoppingCart size={30} className="text-gray-400" />
                        </div>

                        <p className="text-black mb-6 text-md">
                          Your cart is empty!
                        </p>

                        <button
                          onClick={() => setCartOpen(false)}
                          className="bg-[#0d173f] text-white px-6 py-3.5 rounded-full font-medium w-full"
                        >
                          Continue Shopping
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
                            <div className="flex gap-4">
                              <Image
                                src={item.image}
                                alt={item.title}
                                width={60}
                                height={60}
                                className="rounded-md object-cover bg-gray-100 px-2"
                              />

                              <div>
                                <h3 className="font-semibold text-sm">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  ${item.price} × {item.quantity}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 rounded-full bg-gray-100 hover:text-red-500"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t py-4">
                    <div className="flex justify-between items-center text-gray-700 mb-4">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        $
                        {cartItems
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/cart"
                        onClick={() => setCartOpen(false)}
                        className="flex-1 bg-blue-800/90 hover:bg-blue-800 text-white rounded-full py-3 font-semibold text-lg text-center cursor-pointer"
                      >
                        <button className="">View Cart</button>
                      </Link>
                      <Link
                        href="/checkout"
                        onClick={() => setCartOpen(false)}
                        className="flex-1 bg-[#0d173f] text-white rounded-full py-3 cursor-pointer font-semibold text-lg text-center"
                      >
                        <button className="">Checkout</button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex xl:hidden ml-5 animate-slide-right">
            <Menu
              onClick={() => setMobileMenuOpen(true)}
              className="cursor-pointer"
            />
          </div>
          {mobileMenuOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 animate-slide-right">
              {/* Sidebar */}
              <div className="absolute top-0 right-0 h-full w-[330px] bg-white shadow-2xl flex flex-col p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Image src={logo} alt="Logo" width={120} />
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X
                      size={22}
                      className="text-gray-600 hover:text-gray-800"
                    />
                  </button>
                </div>
                <hr className="mb-6" />
                {/* Links */}
                <ul className="flex flex-1 overflow-y-auto flex-col gap-4 text-gray-700 font-medium text-[15px]">
                  <Link
                    href="/popular"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <li className="hover:text-blue-600">Popular</li>
                  </Link>

                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
                    <li className="hover:text-blue-600">Shop</li>
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <li className="hover:text-blue-600">Contact</li>
                  </Link>

                  {/* Pages dropdown */}
                  <li
                    className="flex items-center justify-between cursor-pointer hover:text-blue-600"
                    onClick={() => setPagesOpen(!pagesOpen)}
                  >
                    <span>Pages</span>
                    {pagesOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </li>

                  {pagesOpen && (
                    <ul className="ml-4 flex flex-col gap-4 text-sm">
                      {pagesRoutes.map(({ label, path }) => {
                        const isActive = pathname === path;

                        return (
                          <li key={label}>
                            <Link
                              href={path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block transition-colors ${
                                isActive
                                  ? "text-blue-600 font-semibold"
                                  : "text-gray-600 hover:text-blue-600"
                              }`}
                            >
                              {label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Blogs dropdown */}
                  <li
                    className={`flex items-center justify-between cursor-pointer transition-colors
                ${isBlogActive ? "text-blue-600" : "text-black hover:text-blue-600"}
              `}
                    onClick={() => setBlogsOpen(!blogsOpen)}
                  >
                    <span>Blogs</span>
                    {blogsOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </li>

                  {blogsOpen && (
                    <ul className="ml-4 flex flex-col gap-4 text-sm">
                      {blogRoutes.map(({ label, path }) => (
                        <Link key={label} href={path}>
                          <li
                            className={`cursor-pointer transition-colors
                        ${
                          pathname === path
                            ? "text-blue-600 font-semibold"
                            : "text-gray-600 hover:text-blue-600"
                        }
                      `}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setBlogsOpen(false);
                            }}
                          >
                            {label}
                          </li>
                        </Link>
                      ))}
                    </ul>
                  )}
                </ul>

                <hr className="my-4" />

                {/* Bottom section */}
                <div className="flex flex-col gap-4 top-0 justify-end">
                  <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                      <User size={18} />
                      <span>Sign In / Register</span>
                    </div>
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                      <Heart size={18} />
                      <span>Wishlist</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;

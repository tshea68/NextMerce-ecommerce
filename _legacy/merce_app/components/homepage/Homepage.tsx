import React from "react";
import Hero from "./hero/Hero";
import Subhero from "./subhero/Subhero";
import Browse from "./browse/Browse";
import Editbrowse from "./browse/Editbrowse";
import Arrival from "./newarrivals/Arrival";
import Iphone from "./iphone/Iphone";
import Purchase from "./purchase/Purchase";
import Sellers from "./bestsellers/Sellers";
import Music from "./music/Music";
import Feedback from "./feedback/Feedback";
import Trade from "./trend/Trade";
import Footer from "./footer/Footer";

const Homepage = () => {
  return (
    <div>
      <Hero />
      <Subhero />
      <Editbrowse />
      <Arrival />
      <Iphone />
      <Purchase />
      <Sellers />
      <Music />
      <Feedback />
      <Trade />
    </div>
  );
};

export default Homepage;

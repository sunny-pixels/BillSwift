import React from "react";
import { useState } from "react";
import {
  FaGripLines,
  FaHome,
  FaFileAlt,
  FaShoppingCart,
  FaCog,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SlideBar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-[5%] h-screen flex flex-col items-center justify-betwee text-[#006A71] py-5">
      <FaGripLines
        className="text-xl cursor-pointer hover:text-blue-400 transition mt-6"
        onClick={() => setIsOpen(!isOpen)}
      />

      <div
        className="h-[300px] w-[50px] flex flex-col items-center justify-between py-5 transition-all duration-300"
      >
        <nav
          className={`flex flex-col gap-10 mt-5 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <FaHome
            onClick={() => navigate("/")}
            className="text-xl cursor-pointer hover:text-blue-400 transition"
            title="Home"
          />
          <FaFileAlt
            className="text-xl cursor-pointer hover:text-blue-400 transition"
            title="Files"
          />
          <FaShoppingCart
            className="text-xl cursor-pointer hover:text-blue-400 transition"
            title="Cart"
          />
          <FaCog
            className="text-xl cursor-pointer hover:text-blue-400 transition"
            title="Settings"
          />
        </nav>
      </div>

      {/* <img src="/bs_logo.png" alt="BillSwift Logo" className="w-15 h-15" /> */}
    </div>
  );
};

export default SlideBar;

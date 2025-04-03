import React from "react";
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

  return (
    <div className="w-[5%] h-screen flex flex-col items-center justify-between bg-gray-900 text-white py-5 border-r border-gray-700">
      <FaGripLines className="text-xl cursor-pointer hover:text-blue-400 transition" />

      <nav className="flex flex-col gap-10 mt-5">
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

      <img src="/bs_logo.png" alt="BillSwift Logo" className="w-15 h-15" />
    </div>
  );
};

export default SlideBar;

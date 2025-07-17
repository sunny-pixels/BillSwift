import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HiHome, HiClipboardList, HiDocumentText } from "react-icons/hi";

const SlideBar = ({ isDarkMode }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`w-20 flex flex-col items-center pt-0 pb-8 ${isDarkMode ? 'bg-[#141416]' : 'bg-white'}`}>
      <Link to="/">
        <div className={`p-3 rounded-xl mb-8 ${
          isActive("/")
            ? isDarkMode 
              ? 'bg-[#1A1A1C] text-white' 
              : 'bg-[#f4f4f6] text-[#141416]'
            : isDarkMode
              ? 'text-[#767c8f] hover:text-white hover:bg-[#1A1A1C]'
              : 'text-[#767c8f] hover:text-[#141416] hover:bg-[#f4f4f6]'
        }`}>
          <HiHome className="text-2xl" />
        </div>
      </Link>
      <Link to="/inventory">
        <div className={`p-3 rounded-xl mb-8 ${
          isActive("/inventory")
            ? isDarkMode 
              ? 'bg-[#1A1A1C] text-white' 
              : 'bg-[#f4f4f6] text-[#141416]'
            : isDarkMode
              ? 'text-[#767c8f] hover:text-white hover:bg-[#1A1A1C]'
              : 'text-[#767c8f] hover:text-[#141416] hover:bg-[#f4f4f6]'
        }`}>
          <HiClipboardList className="text-2xl" />
        </div>
      </Link>
      <Link to="/bill">
        <div className={`p-3 rounded-xl ${
          isActive("/bill")
            ? isDarkMode 
              ? 'bg-[#1A1A1C] text-white' 
              : 'bg-[#f4f4f6] text-[#141416]'
            : isDarkMode
              ? 'text-[#767c8f] hover:text-white hover:bg-[#1A1A1C]'
              : 'text-[#767c8f] hover:text-[#141416] hover:bg-[#f4f4f6]'
        }`}>
          <HiDocumentText className="text-2xl" />
        </div>
      </Link>
    </div>
  );
};

export default SlideBar;

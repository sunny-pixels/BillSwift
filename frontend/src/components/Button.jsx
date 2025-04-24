import React from "react";

const Button = ({ name, onClick, icon }) => {
  return (
    <div>
      <button
        onClick={onClick}
        className="flex items-center justify-center gap-3 px-5 py-2 bg-[#2a2a2d] hover:bg-[#767c8f] text-white font-medium rounded-[240px]"
      >
        {icon}
        {name}
      </button>
    </div>
  );
};

export default Button;

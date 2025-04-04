import React from "react";

const Button = ({ name, onClick }) => {
  return (
    <div className="flex justify-end w-[auto] gap-7">
      <button
        onClick={onClick}
        className="px-5 py-2 bg-[#48A6A7] hover:bg-[#006A71] text-white font-medium rounded-lg transition duration-200 shadow-sm"
      >
        {name}
      </button>
    </div>
  );
};

export default Button;

import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {

  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center gap-5 justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">Welcome to BillSwift</h1>
      <p className="text-sm">Manage your billing efficiently.</p>
      <button
        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition"
        onClick={() => navigate("/inventory")}
      >
        Inventory
      </button>
    </div>
  );
};

export default HomePage;

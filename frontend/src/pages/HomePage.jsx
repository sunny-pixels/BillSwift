import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#F2EFE7] to-[#F2EFE7] text-gray-800">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#006A71]">
            BillSwift
          </h1>
          <p className="text-gray-600">Streamline your billing management experience</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="p-4 bg-[#F2EFE7] border border-[#9ACBD0] rounded-lg">
            <h2 className="text-lg font-medium mb-2 text-[#48A6A7]">Simplified Billing</h2>
            <p className="text-sm text-gray-600">Create, send, and track invoices in just a few clicks</p>
          </div>
          
          <div className="p-4 bg-[#F2EFE7] border border-[#9ACBD0] rounded-lg">
            <h2 className="text-lg font-medium mb-2 text-[#48A6A7]">Inventory Management</h2>
            <p className="text-sm text-gray-600">Keep track of your products and services with ease</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            className="w-full py-3 bg-[#48A6A7] hover:bg-[#006A71] text-white font-medium rounded-lg transition duration-300 shadow-md"
            onClick={() => navigate("/inventory")}
          >
            Manage Inventory
          </button>
          
          <button
            className="w-full py-3 bg-[#9ACBD0] hover:bg-[#48A6A7] text-white font-medium rounded-lg transition duration-300"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-[#006A71]">© 2025 BillSwift. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
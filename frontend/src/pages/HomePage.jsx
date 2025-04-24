import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a66e5]">
      <div className="max-w-md w-full p-8 bg-white rounded-[24px]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#141416]">
            BillSwift
          </h1>
          <p className="text-[#767c8f] text-base">Streamline your billing management experience</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="p-6 bg-[#f3f4f6] rounded-[24px]">
            <h2 className="text-lg font-bold text-[#141416]">Simplified Billing</h2>
            <p className="text-sm text-[#767c8f]">Create, send, and track invoices in just a few clicks</p>
          </div>
          
          <div className="p-6 bg-[#f3f4f6] rounded-[24px]">
            <h2 className="text-lg font-bold text-[#141416]">Inventory Management</h2>
            <p className="text-sm text-[#767c8f]">Keep track of your products and services with ease</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            className="w-full py-3 px-6 border rounded-3xl bg-[#0a66e5] hover:bg-[#0952b7] text-white font-medium"
            onClick={() => navigate("/inventory")}
          >
            Manage Inventory
          </button>
          
          <button
            className="w-full py-3 px-6 border-none rounded-3xl bg-[#facd40] hover:bg-[#e5b832] text-[#141416] font-medium transition duration-300"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-[#767c8f]">© 2025 BillSwift. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
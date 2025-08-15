import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const handleManageInventory = () => {
    if (user) {
      // User is authenticated, navigate to inventory
      navigate("/inventory");
    } else {
      // User is not authenticated, open sign-in modal
      openSignIn();
    }
  };

  const handleGoToDashboard = () => {
    if (user) {
      // User is authenticated, navigate to dashboard
      navigate("/dashboard");
    } else {
      // User is not authenticated, open sign-in modal
      openSignIn();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a66e5]">
      <div className="max-w-md w-full p-8 bg-white rounded-[24px]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#141416]">BillSwift</h1>
          <p className="text-[#767c8f] text-base">
            Streamline your billing management experience
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="p-6 bg-[#f3f4f6] rounded-[24px]">
            <h2 className="text-lg font-bold text-[#141416]">
              Simplified Billing
            </h2>
            <p className="text-sm text-[#767c8f]">
              Create, send, and track invoices in just a few clicks
            </p>
          </div>

          <div className="p-6 bg-[#f3f4f6] rounded-[24px]">
            <h2 className="text-lg font-bold text-[#141416]">
              Inventory Management
            </h2>
            <p className="text-sm text-[#767c8f]">
              Keep track of your products and services with ease
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            className="w-full py-3 px-6 bg-[#0a66e5] hover:bg-[#0952b7] text-white font-medium"
            onClick={handleManageInventory}
          >
            Manage Inventory
          </button>

          <button
            className="w-full py-3 px-6 bg-[#facd40] hover:bg-[#e5b832] text-[#141416] font-medium rounded transition duration-300"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>

        {/* Show user button if authenticated */}
        {user && (
          <div className="mt-6 flex justify-center">
            <UserButton />
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-[#767c8f]">
            © 2025 BillSwift. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

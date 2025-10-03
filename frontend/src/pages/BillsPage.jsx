import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBills, deleteBill } from "../services/billsService";
import SlideBar from "../components/SlideBar";
import toast from "react-hot-toast";
import { HiSun, HiMoon, HiTrash, HiEye, HiArrowLeft } from "react-icons/hi2";

const BillsPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await getAllBills();
      if (response.bills) {
        setBills(response.bills);
      } else {
        toast.error("Failed to fetch bills");
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId, billName) => {
    if (window.confirm(`Are you sure you want to delete "${billName}"?`)) {
      try {
        const response = await deleteBill(billId);
        if (response.error) {
          toast.error("Failed to delete bill");
        } else {
          toast.success("Bill deleted successfully");
          fetchBills(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting bill:", error);
        toast.error("Failed to delete bill");
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.body.style.backgroundColor = newTheme ? "#141416" : "#ffffff";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className={`flex p-6 ${isDarkMode ? "bg-[#141416]" : "bg-white"}`}>
        <SlideBar isDarkMode={isDarkMode} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3379E9]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex p-6 ${isDarkMode ? "bg-[#141416]" : "bg-white"}`}>
      <SlideBar isDarkMode={isDarkMode} />
      <div className="flex-1 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/bill")}
              className={`p-2 rounded-[12px] inline-flex items-center justify-center ${
                isDarkMode
                  ? "bg-[#2a2a2d] text-white hover:bg-[#1A1A1C]"
                  : "bg-[#f4f4f6] text-[#141416] hover:bg-[#e8e8ea]"
              }`}
            >
              <HiArrowLeft className="text-xl" />
            </button>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-[#141416]"
              }`}
            >
              All Bills
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isDarkMode
                  ? "bg-[#3379E9] text-white"
                  : "bg-[#3379E9] text-white"
              }`}
            >
              {bills.length} bills
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-[24px] inline-flex items-center justify-center ${
                isDarkMode
                  ? "bg-[#2a2a2d] text-white hover:bg-[#1A1A1C]"
                  : "bg-[#f4f4f6] text-[#141416] hover:bg-[#e8e8ea]"
              }`}
            >
              {isDarkMode ? (
                <HiSun className="text-xl" />
              ) : (
                <HiMoon className="text-xl" />
              )}
            </button>
          </div>
        </div>

        {/* Bills Grid */}
        {bills.length === 0 ? (
          <div
            className={`flex-1 flex items-center justify-center p-12 rounded-[24px] ${
              isDarkMode
                ? "bg-[#1A1A1C] border-[#1A1A1C]"
                : "bg-white border-[#f4f4f6]"
            }`}
          >
            <div className="text-center">
              <div
                className={`text-6xl mb-4 ${
                  isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                }`}
              >
                📄
              </div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-[#141416]"
                }`}
              >
                No bills found
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                }`}
              >
                Create your first bill to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bills.map((bill) => (
              <div
                key={bill._id}
                className={`p-6 rounded-[24px] border-2 ${
                  isDarkMode
                    ? "bg-[#1A1A1C] border-[#2a2a2d]"
                    : "bg-white border-[#f4f4f6]"
                }`}
              >
                {/* Bill Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-white" : "text-[#141416]"
                      }`}
                    >
                      {bill.billId || "Bill"}
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                      }`}
                    >
                      {formatDate(bill.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bill.status === "finalized"
                          ? "bg-green-100 text-green-800"
                          : bill.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                {bill.customer?.phone && (
                  <div className="mb-4">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                      }`}
                    >
                      Customer: {bill.customer.phone}
                    </p>
                  </div>
                )}

                {/* Items Summary */}
                <div className="mb-4">
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                    }`}
                  >
                    {bill.items?.length || 0} items
                  </p>
                  {bill.items && bill.items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {bill.items.slice(0, 2).map((item, index) => (
                        <div
                          key={index}
                          className={`text-sm ${
                            isDarkMode ? "text-white" : "text-[#141416]"
                          }`}
                        >
                          {item.product} × {item.quantity}
                        </div>
                      ))}
                      {bill.items.length > 2 && (
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                          }`}
                        >
                          +{bill.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                      }`}
                    >
                      Total:
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-white" : "text-[#141416]"
                      }`}
                    >
                      {formatCurrency(bill.total || 0)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteBill(bill._id, bill.billId)}
                    className={`flex-1 p-2 rounded-[12px] inline-flex items-center justify-center gap-2 transition-colors ${
                      isDarkMode
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    <HiTrash className="text-sm" />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement view bill details modal
                      toast.info("View bill details - Coming soon!");
                    }}
                    className={`flex-1 p-2 rounded-[12px] inline-flex items-center justify-center gap-2 transition-colors ${
                      isDarkMode
                        ? "bg-[#3379E9]/10 text-[#3379E9] hover:bg-[#3379E9]/20"
                        : "bg-[#3379E9]/10 text-[#3379E9] hover:bg-[#3379E9]/20"
                    }`}
                  >
                    <HiEye className="text-sm" />
                    <span className="text-sm font-medium">View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsPage;

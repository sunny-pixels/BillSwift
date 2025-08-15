import React, { useState, useEffect, useRef } from "react";
import SlideBar from "../components/SlideBar";
import SearchItemInventory from "../components/SearchItemInventory";
import Table from "../components/Table";
import { useNavigate } from "react-router-dom";
import AddItemsModal from "../components/AddItemsModal";
import axios from "axios";
import { HiPlus } from "react-icons/hi2";
import { HiArrowUpRight } from "react-icons/hi2";
import { HiMoon, HiSun } from "react-icons/hi2";

const InventoryPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; // Default to dark if no preference
  });

  // Refs for Tab navigation
  const searchRef = useRef(null);
  const addItemRef = useRef(null);
  const generateBillRef = useRef(null);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.body.style.backgroundColor = newTheme ? "#141416" : "#ffffff";
  };

  const handleAddClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleGenerateBill = () => {
    navigate("/bill");
  };

  const handleItemAdded = (newItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
  };

  const handleHighlightRecord = (item) => {
    setHighlightedItemId(item.itemCode || item._id);
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 1500);
  };

  // Function to refresh items and calculate total value
  const fetchItems = () => {
    let apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      alert(
        "VITE_API_URL is not set. Please check your environment variables."
      );
      setItems([]);
      setTotalValue(0);
      return;
    }
    // Ensure the URL does not have a trailing slash for consistency
    if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1);
    axios
      .get(apiUrl)
      .then((result) => {
        // Ensure result.data is an array
        const data = Array.isArray(result.data) ? result.data : [];
        setItems(data);
        // Calculate total value
        const total = data.reduce((sum, item) => sum + (item.netamt || 0), 0);
        setTotalValue(total);
      })
      .catch((err) => {
        setItems([]);
        setTotalValue(0);
        alert(
          "Failed to fetch inventory items. Please check your backend connection."
        );
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    // Set initial background color
    document.body.style.backgroundColor = isDarkMode ? "#141416" : "#ffffff";
  }, []);

  // Add this useEffect to recalculate totalValue on items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (item.netamt || 0), 0);
    setTotalValue(total);
  }, [items]);

  // Handle Tab from last table cell - move to Add Item button
  const handleLastTableCellTab = () => {
    if (addItemRef.current) {
      addItemRef.current.focus();
    }
  };

  // Handle Tab from Generate Bill button - move to search
  const handleGenerateBillTab = () => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  return (
    <div className={`flex p-6 ${isDarkMode ? "bg-[#141416]" : "bg-white"}`}>
      <SlideBar isDarkMode={isDarkMode} />
      <div className="flex-1 flex flex-col gap-6">
        {/* Top Cards Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className={`p-6 rounded-[24px] bg-[#0a66e5]`}>
            <div className="text-white text-sm mb-1 font-bold">Total Value</div>
            <div className="text-white text-4xl font-medium">
              ₹{totalValue.toLocaleString()}
            </div>
          </div>
          <div
            className={`p-6 rounded-[24px] border-3 ${
              isDarkMode
                ? "bg-[#1A1A1C] border-[#1A1A1C]"
                : "bg-white border-[#f4f4f6]"
            }`}
          >
            <div className="text-[#767c8f] text-sm mb-1 font-bold">
              Total Items
            </div>
            <div
              className={`text-4xl font-medium ${
                isDarkMode ? "text-white" : "text-[#141416]"
              }`}
            >
              {items.length}
            </div>
          </div>
          <div
            className={`p-6 rounded-[24px] border-3 ${
              isDarkMode
                ? "bg-[#1A1A1C] border-[#1A1A1C]"
                : "bg-white border-[#f4f4f6]"
            }`}
          >
            <div className="text-[#767c8f] text-sm mb-1 font-bold">
              Low Stock Items
            </div>
            <div
              className={`text-4xl font-medium ${
                isDarkMode ? "text-white" : "text-[#141416]"
              }`}
            >
              {items.filter((item) => (item.quantity || 0) < 10).length}
            </div>
          </div>
          <div
            className={`p-6 rounded-[24px] border-3 ${
              isDarkMode
                ? "bg-[#1A1A1C] border-[#1A1A1C]"
                : "bg-white border-[#f4f4f6]"
            }`}
          >
            <div className="text-[#767c8f] text-sm mb-1 font-bold">
              Out of Stock
            </div>
            <div
              className={`text-4xl font-medium ${
                isDarkMode ? "text-white" : "text-[#141416]"
              }`}
            >
              {items.filter((item) => (item.quantity || 0) === 0).length}
            </div>
          </div>
        </div>

        {/* Search and Title Section */}
        <div
          className={`p-6 rounded-[24px] border-3 ${
            isDarkMode
              ? "bg-[#1A1A1C] border-[#1A1A1C]"
              : "bg-white border-[#f4f4f6]"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-[#141416]"
              }`}
            >
              Inventory Management
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full inline-flex items-center justify-center ${
                  isDarkMode
                    ? "bg-[#2a2a2d] text-white hover:bg-[#1A1A1C]"
                    : "bg-[#f4f4f6] text-[#141416] hover:bg-[#e8e8ea]"
                }`}
                tabIndex={-1} // Exclude from Tab order
              >
                {isDarkMode ? (
                  <HiSun className="text-xl" />
                ) : (
                  <HiMoon className="text-xl" />
                )}
              </button>
              <div className="relative w-[400px]">
                <SearchItemInventory
                  ref={searchRef}
                  name="Search Product"
                  onItemHighlight={handleHighlightRecord}
                  className={`w-full px-0 py-0 rounded-[240px] focus:outline-none flex items-center gap-4 ${
                    isDarkMode ? "bg-[#2a2a2d]" : "bg-[#f4f4f6]"
                  }`}
                  iconWrapperClassName={`px-3 py-3 rounded-full flex items-center justify-center ${
                    isDarkMode ? "bg-[#facd40]" : "bg-[#facd40]"
                  }`}
                  iconClassName={
                    isDarkMode
                      ? "text-black text-base"
                      : "text-[#141416] text-base"
                  }
                  placeholderClassName={`text-base font-medium ${
                    isDarkMode ? "text-[#767c8f]" : "text-[#141416]"
                  }`}
                  tabIndex={1} // First in Tab order
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className={`px-6 ${isDarkMode ? "bg-[#1A1A1C]" : "bg-white"}`}>
            {/* Keyboard Navigation Instructions */}
            <div
              className={`mb-4 text-sm ${
                isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
              }`}
            ></div>
            <div>
              <Table
                items={items}
                setItems={setItems}
                highlightedItemId={highlightedItemId}
                isDarkMode={isDarkMode}
                onLastCellTab={handleLastTableCellTab}
                className={`w-full border-collapse [&_td]:border-2 [&_th]:border-2 ${
                  isDarkMode
                    ? "[&_td]:border-[#2a2a2d] [&_th]:border-[#2a2a2d]"
                    : "[&_td]:border-[#f4f4f6] [&_th]:border-[#f4f4f6]"
                }`}
                headerClassName={`font-medium ${
                  isDarkMode
                    ? "bg-[#1A1A1C] text-[#767c8f]"
                    : "bg-white text-[#767c8f]"
                }`}
                rowClassName={`${
                  isDarkMode
                    ? "text-white hover:bg-[#2a2a2d]"
                    : "text-[#141416] hover:bg-[#f4f4f6]"
                }`}
                highlightClassName={
                  isDarkMode ? "bg-[#2a2a2d]" : "bg-[#f4f4f6]"
                }
                iconClassName={`transition-colors duration-150 ${
                  isDarkMode
                    ? "text-[#767c8f] hover:text-white"
                    : "text-[#767c8f] hover:text-[#141416]"
                }`}
                cellClassName="px-6 py-4 rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            ref={addItemRef}
            onClick={handleAddClick}
            className={`px-4 py-2 font-medium rounded inline-flex items-center transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 focus:drop-shadow-[0_0_15px_rgba(51,121,233,0.4)] ${
              isDarkMode
                ? "bg-[#2a2a2d] hover:bg-[#1A1A1C] text-white"
                : "bg-[#141416] hover:bg-[#2a2a2d] text-white"
            }`}
            tabIndex={2 + items.length * 4} // After all table cells (search=1, table cells start at 2)
          >
            <HiPlus className="text-lg mr-2 stroke-2" />
            Add Item
          </button>
          <button
            ref={generateBillRef}
            onClick={handleGenerateBill}
            className={`px-4 py-2 font-medium rounded inline-flex items-center transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 focus:drop-shadow-[0_0_15px_rgba(51,121,233,0.4)] ${
              isDarkMode
                ? "bg-[#2a2a2d] hover:bg-[#1A1A1C] text-white"
                : "bg-[#f4f4f6] hover:bg-[#e8e8ea] text-[#141416]"
            }`}
            tabIndex={2 + items.length * 4 + 1} // After Add Item button
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                handleGenerateBillTab();
              }
            }}
          >
            <HiArrowUpRight className="text-lg mr-2 stroke-2" />
            Generate Bill
          </button>
        </div>
      </div>

      <AddItemsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onItemAdded={handleItemAdded}
        isDarkMode={isDarkMode}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center"
        modalClassName={`p-6 w-full max-w-3xl border rounded-[24px] shadow-xl ${
          isDarkMode
            ? "bg-[#1A1A1C]/90 border-white/10 backdrop-blur-xl"
            : "bg-white/90 border-black/5 backdrop-blur-xl"
        }`}
        headerClassName={`font-bold text-xl ${
          isDarkMode ? "text-white" : "text-[#141416]"
        }`}
        inputClassName={`w-full p-4 rounded-[16px] mb-4 focus:outline-none border transition-colors duration-200 ${
          isDarkMode
            ? "bg-[#2a2a2d]/80 border-white/10 text-white placeholder-[#767c8f] focus:border-[#3379E9]"
            : "bg-[#f4f4f6]/80 border-black/5 text-[#141416] placeholder-[#767c8f] focus:border-[#3379E9]"
        }`}
        buttonClassName={`w-full p-4 rounded-[16px] transition-colors duration-200 ${
          isDarkMode
            ? "bg-[#3379E9] hover:bg-[#1466e4] text-white"
            : "bg-[#3379E9] hover:bg-[#1466e4] text-white"
        }`}
      />
    </div>
  );
};

export default InventoryPage;

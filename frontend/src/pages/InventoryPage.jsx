import React, { useState, useEffect } from "react";
import SlideBar from "../components/SlideBar";
import SearchItemInventory from "../components/SearchItemInventory";
import Table from "../components/Table";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import AddItemsModal from "../components/AddItemsModal";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { LuArrowUpRight } from "react-icons/lu";
const BASE_URL = import.meta.env.VITE_API_URL

const InventoryPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const [totalValue, setTotalValue] = useState(0);

  // Function to calculate total value based on current items
  const calculateTotalValue = (itemsArray) => {
    return itemsArray.reduce((sum, item) => sum + (item.netamt || 0), 0);
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
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    // Update total value when a new item is added
    setTotalValue(calculateTotalValue(updatedItems));
  };

  const handleHighlightRecord = (item) => {
    setHighlightedItemId(item.itemCode || item._id);

    // Automatically clear the highlight after 3 seconds
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 1500);
  };

  // Function to refresh items
  const fetchItems = () => {
    axios
      .get(`${BASE_URL}`)
      // .get(`http://localhost:5001/`)
      .then((result) => {
        setItems(result.data);
        // Calculate total value
        setTotalValue(calculateTotalValue(result.data));
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Function to update items and recalculate total value
  const handleItemsChange = (updatedItems) => {
    setItems(updatedItems);
    setTotalValue(calculateTotalValue(updatedItems));
  };

  return (
    <div className="flex h-screen bg-[#141416]">
      <SlideBar />
      <div className="flex-1 flex flex-col p-6">
        <div className="h-[120px] flex gap-8">
          <div className="w-[23%] bg-[#0a66e5] border-none rounded-3xl p-4 text-white">
            <div className="text-sm font-bold">Total Value</div>
            <div className="text-4xl font-medium pt-2">
              ₹{totalValue.toLocaleString()}
            </div>
          </div>
          <div className="w-[23%] bg-[#1A1A1C] border-none rounded-3xl p-4 text-[#767c8f]">
            <div className="text-sm font-bold">Total Items</div>
            <div className="text-4xl font-medium pt-2 text-white">
              {items.length}
            </div>
          </div>
          <div className="w-[23%] bg-[#1A1A1C] border-none rounded-3xl p-4 text-[#767c8f]">
            <div className="text-sm font-bold">Low Stock Items</div>
            <div className="text-4xl font-medium pt-2 text-white">
              {items.filter((item) => (item.quantity || 0) < 3).length}
            </div>
          </div>
          <div className="w-[23%] bg-[#1A1A1C] border-none rounded-3xl p-4 text-[#767c8f]">
            <div className="text-sm font-bold">Out of Stock</div>
            <div className="text-4xl font-medium pt-2 text-white">
              {items.filter((item) => (item.quantity || 0) === 0).length}
            </div>
          </div>
        </div>

        <div className=" bg-[#1A1A1C] mt-5 rounded-[20px] h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white pl-10 pt-4">
              Inventory Management
            </h1>
            <div className="relative w-1/2 mt-7 mr-7">
              <SearchItemInventory
                name="Search Product"
                onItemHighlight={handleHighlightRecord}
              />
            </div>
          </div>

          <div>
            <Table
              items={items}
              setItems={handleItemsChange} // Use the new handler
              highlightedItemId={highlightedItemId}
            />
          </div>
        </div>

        <div className="flex justify-end gap-7 mt-7">
          <Button name="Add Item" onClick={handleAddClick} icon={<FaPlus />} />
          <Button
            name="Generate Bill"
            onClick={handleGenerateBill}
            icon={<LuArrowUpRight />}
          />
        </div>
      </div>

      <AddItemsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onItemAdded={handleItemAdded}
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
        modalClassName="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
        headerClassName="text-[#006A71] font-bold text-xl mb-4"
        inputClassName="w-full p-2 border border-[#9ACBD0] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#48A6A7]"
        buttonClassName="px-4 py-2 bg-[#48A6A7] hover:bg-[#006A71] text-white font-medium rounded-lg transition duration-200 shadow-sm"
      />
    </div>
  );
};

export default InventoryPage;
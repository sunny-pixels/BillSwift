import React, { useState, useEffect } from "react";
import SlideBar from "../components/SlideBar";
import SearchItemInventory from "../components/SearchItemInventory";
import Table from "../components/Table";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import AddItemsModal from "../components/AddItemsModal";
import axios from "axios";

const InventoryPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]);
  const [highlightedItemId, setHighlightedItemId] = useState(null);

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
    console.log("Item highlighted ", item);
    setHighlightedItemId(item.itemCode || item._id);
    
    // Automatically clear the highlight after 3 seconds
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 1500);
  };

  // Function to refresh items
  const fetchItems = () => {
    axios
      .get("http://localhost:5001")
      .then((result) => setItems(result.data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="flex h-screen bg-[#F2EFE7]">
      <SlideBar />
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#006A71]">Inventory Management</h1>
          <div className="relative w-1/2">
            <SearchItemInventory 
              name="Search Product" 
              onItemHighlight={handleHighlightRecord} 
              className="w-full px-4 py-2 border border-[#9ACBD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48A6A7]"
            />
          </div>
        </div>
        
        <div className="flex max-h-[452px] bg-white rounded-xl shadow-md overflow-hidden">
          <Table 
            items={items} 
            setItems={setItems} 
            highlightedItemId={highlightedItemId}
            className="w-full divide-y divide-[#9ACBD0]"
            headerClassName="bg-[#F2EFE7] text-[#006A71]"
            rowClassName="hover:bg-[#F2EFE7] transition-colors duration-150"
            highlightClassName="bg-[#9ACBD0] bg-opacity-30"
          />
        </div>
        
        <div className="flex justify-end gap-7 mt-8">
          <Button 
            name="Add Item" 
            onClick={handleAddClick}
          />
          <Button 
            name="Generate Bill" 
            onClick={handleGenerateBill}
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
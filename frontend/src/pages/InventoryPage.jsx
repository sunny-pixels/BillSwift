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
    <div>
      <div className="flex">
        <SlideBar />
        <div className="w-[100%] flex flex-col items-center">
          <div className="relative w-full">
            <SearchItemInventory name="Search Product" onItemHighlight={handleHighlightRecord} />
          </div>
          <Table items={items} setItems={setItems} highlightedItemId={highlightedItemId} />
          <div className="flex gap-6 self-end mt-10 mr-15">
            <Button name="Add Item" onClick={handleAddClick} />
            <Button name="Generate Bill" onClick={handleGenerateBill} />
          </div>
        </div>
      </div>
      <AddItemsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default InventoryPage;

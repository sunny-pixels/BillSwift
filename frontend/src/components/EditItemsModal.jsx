import React, { useState, useEffect } from "react";
import Button from "./Button";
import axios from 'axios';

const EditItemsModal = ({ isOpen, onClose, itemId, onItemUpdated }) => {
  // Move state and hooks to the parent component
  const [itemCode, setItemCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [product, setProduct] = useState("");
  const [mrp, setMrp] = useState("");
  const [originalItem, setOriginalItem] = useState(null);

  // Use the passed itemId instead of useParams
  useEffect(() => {
    if (isOpen && itemId) {
      axios
        .get("http://localhost:5001/getItem/" + itemId)
        .then((result) => {
          const item = result.data;
          // Store the original item for reference
          setOriginalItem(item);
          // Populate form with data from API
          setItemCode(item.itemCode || "");
          setProduct(item.product || "");
          setQuantity(item.quantity || "");
          setMrp(item.mrp || "");
        })
        .catch((err) => console.log(err));
    }
  }, [isOpen, itemId]);
  
  const handleEdit = (e) => {
    e.preventDefault();
    // Prevent bubbling of click event
    e.stopPropagation();

    const netamt = Number(quantity) * Number(mrp);
    
    const updatedItem = {
      _id: itemId,
      itemCode,
      product,
      quantity,
      mrp,
      netamt
    };
    
    axios
      .put("http://localhost:5001/updateItem/" + itemId, updatedItem)
      .then((response) => {
        // Call the callback with the updated item to update parent state
        if (onItemUpdated) {
          onItemUpdated(updatedItem);
        }
        onClose();
      })
      .catch(err => console.log(err));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        // Only close when clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-lg w-[auto] flex flex-col gap-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Your Item</h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-3xl"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="flex gap-10">
          <input
            className="border p-3"
            type="text"
            placeholder="Enter ItemCode"
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
          />
          <input
            className="border p-3"
            type="text"
            placeholder="Enter Product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            className="border p-3"
            type="number"
            placeholder="Enter Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <input
            className="border p-3"
            type="number"
            placeholder="Enter Mrp"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
          />
        </form>
        <Button name={"Save Changes"} onClick={handleEdit} />
      </div>
    </div>
  );
};

export default EditItemsModal;
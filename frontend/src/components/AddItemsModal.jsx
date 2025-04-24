import React, { useState } from "react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL



const AddItemsModal = ({ isOpen, onClose, onItemAdded }) => {
  const [itemCode, setItemCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [product, setProduct] = useState("");
  const [mrp, setMrp] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const netamt = Number(quantity) * Number(mrp);

    axios
      .post(`${BASE_URL}/createItem`, {
        itemCode,
        product,
        quantity: Number(quantity),
        mrp: Number(mrp),
        netamt,
      })
      .then((result) => {
        console.log("item created:", result);
        // Pass the newly created item back to the parent component
        if (onItemAdded) {
          onItemAdded(result.data);
        }

        // Clear the form
        setItemCode("");
        setQuantity("");
        setProduct("");
        setMrp("");

        // Close the modal
        onClose();
      })
      .catch((err) => console.log(err));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center text-[15px] z-20">
      <div className="bg-[#202124] p-6 rounded-lg shadow-lg w-[500px] flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Add Your Item</h2>
          <button
            className="text-white hover:text-[#9594a0] text-3xl"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <input
              className="border p-3 text-white focus-within:ring-1 outline-none rounded-lg"
              type="text"
              placeholder="Enter ItemCode"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              required
            />
            <input
              className="border p-3 text-white focus-within:ring-1 outline-none rounded-lg"
              type="text"
              placeholder="Enter Product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
            />
            <input
              className="border p-3 text-white focus-within:ring-1 outline-none rounded-lg"
              type="number"
              placeholder="Enter Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <input
              className="border p-3 text-white focus-within:ring-1 outline-none rounded-lg"
              type="number"
              placeholder="Enter Mrp"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#0a66e5] hover:bg-[#9594a0] text-white font-bold py-2 px-4 mt-7 rounded self-end"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemsModal;

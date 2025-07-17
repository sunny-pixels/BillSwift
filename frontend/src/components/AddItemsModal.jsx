import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AddItemsModal = ({
  isOpen,
  onClose,
  onItemAdded,
  isDarkMode,
  overlayClassName,
  modalClassName,
  headerClassName,
  inputClassName,
  buttonClassName,
}) => {
  const [itemCode, setItemCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [product, setProduct] = useState("");
  const [mrp, setMrp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setItemCode("");
    setQuantity("");
    setProduct("");
    setMrp("");
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const netamt = Number(quantity) * Number(mrp);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/createItem`,
        {
          itemCode,
          product,
          quantity: Number(quantity),
          mrp: Number(mrp),
          netamt,
        }
      );

      // Pass the newly created item back to the parent component
      if (onItemAdded) {
        onItemAdded(response.data);
      }

      toast.success("Item added successfully!");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(
        error.response?.data?.message || "Failed to add item. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputBaseClassName = `w-full p-4 rounded-[16px] mb-4 focus:outline-none border transition-colors duration-200 ${
    isDarkMode
      ? "bg-[#2a2a2d]/80 border-white/10 text-white placeholder-[#767c8f] focus:border-[#3379E9]"
      : "bg-[#f4f4f6]/80 border-black/5 text-[#141416] placeholder-[#767c8f] focus:border-[#3379E9]"
  }`;

  return (
    <div className={overlayClassName}>
      <div className={modalClassName}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={headerClassName}>Add Your Item</h2>
          <button
            className="text-inherit opacity-60 hover:opacity-100 text-3xl transition-opacity"
            onClick={() => {
              resetForm();
              onClose();
            }}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <input
              className={inputBaseClassName}
              type="text"
              placeholder="Enter ItemCode"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <input
              className={inputBaseClassName}
              type="text"
              placeholder="Enter Product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <input
              className={inputBaseClassName}
              type="number"
              placeholder="Enter Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="0"
              disabled={isSubmitting}
            />
            <input
              className={inputBaseClassName}
              type="number"
              placeholder="Enter Mrp"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              required
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className={`${buttonClassName} ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemsModal;

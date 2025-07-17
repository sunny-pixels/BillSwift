// import React, { useState, useEffect } from "react";
// import Button from "./Button";
// import axios from "axios";

// const EditItemsModal = ({ isOpen, onClose, itemId, onItemUpdated }) => {
//   // Move state and hooks to the parent component
//   const [itemCode, setItemCode] = useState("");
//   const [quantity, setQuantity] = useState("");
//   const [product, setProduct] = useState("");
//   const [mrp, setMrp] = useState("");
//   const [originalItem, setOriginalItem] = useState(null);

//   // Use the passed itemId instead of useParams
//   useEffect(() => {
//     if (isOpen && itemId) {
//       axios
//         .get("http://localhost:5001/getItem/" + itemId)
//         .then((result) => {
//           const item = result.data;
//           // Store the original item for reference
//           setOriginalItem(item);
//           // Populate form with data from API
//           setItemCode(item.itemCode || "");
//           setProduct(item.product || "");
//           setQuantity(item.quantity || "");
//           setMrp(item.mrp || "");
//         })
//         .catch((err) => console.log(err));
//     }
//   }, [isOpen, itemId]);

//   const handleEdit = (e) => {
//     e.preventDefault();
//     // Prevent bubbling of click event
//     e.stopPropagation();

//     const netamt = Number(quantity) * Number(mrp);

//     const updatedItem = {
//       _id: itemId,
//       itemCode,
//       product,
//       quantity,
//       mrp,
//       netamt,
//     };

//     axios
//       .put("http://localhost:5001/updateItem/" + itemId, updatedItem)
//       .then((response) => {
//         // Call the callback with the updated item to update parent state
//         if (onItemUpdated) {
//           onItemUpdated(updatedItem);
//         }
//         onClose();
//       })
//       .catch((err) => console.log(err));
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
//       onClick={(e) => {
//         // Only close when clicking the backdrop, not the modal content
//         if (e.target === e.currentTarget) {
//           onClose();
//         }
//       }}
//     >
//       <div
//         className="bg-[#ecebe8] p-6 rounded-lg shadow-lg w-[auto] flex flex-col gap-10"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex justify-between items-center">
//           <h2 className="text-xl font-bold text-[#141416]">Edit Your Item</h2>
//           <button
//             className="text-gray-500 hover:text-[#48A6A7] text-3xl"
//             onClick={onClose}
//             type="button"
//           >
//             ×
//           </button>
//         </div>
//         <form className="flex gap-10">
//           <input
//             className="border p-3 border-[#c4d4d6] focus-within:ring-1 outline-none focus-within:ring-[#48A6A7] rounded-lg"
//             type="text"
//             placeholder="Enter ItemCode"
//             value={itemCode}
//             onChange={(e) => setItemCode(e.target.value)}
//           />
//           <input
//             className="border p-3 border-[#c4d4d6] focus-within:ring-1 outline-none focus-within:ring-[#48A6A7] rounded-lg"
//             type="text"
//             placeholder="Enter Product"
//             value={product}
//             onChange={(e) => setProduct(e.target.value)}
//           />
//           <input
//             className="border p-3 border-[#c4d4d6] focus-within:ring-1 outline-none focus-within:ring-[#48A6A7] rounded-lg"
//             type="number"
//             placeholder="Enter Quantity"
//             value={quantity}
//             onChange={(e) => setQuantity(e.target.value)}
//           />
//           <input
//             className="border p-3 border-[#c4d4d6] focus-within:ring-1 outline-none focus-within:ring-[#48A6A7] rounded-lg"
//             type="number"
//             placeholder="Enter Mrp"
//             value={mrp}
//             onChange={(e) => setMrp(e.target.value)}
//           />
//         </form>
//         <Button name={"Save Changes"} onClick={handleEdit} />
//       </div>
//     </div>
//   );
// };

// export default EditItemsModal;

import React, { useState, useEffect } from "react";
import axios from 'axios';

const EditItemsModal = ({
  isOpen,
  onClose,
  itemId,
  onItemUpdated,
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

  useEffect(() => {
    if (isOpen && itemId) {
      axios
        .get("http://localhost:5001/getItem/" + itemId)
        .then((result) => {
          const item = result.data;
          setItemCode(item.itemCode || "");
          setProduct(item.product || "");
          setQuantity(item.quantity || "");
          setMrp(item.mrp || "");
        })
        .catch((err) => console.log(err));
    }
  }, [isOpen, itemId]);

  const resetForm = () => {
    setItemCode("");
    setQuantity("");
    setProduct("");
    setMrp("");
    setIsSubmitting(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const netamt = Number(quantity) * Number(mrp);
      const updatedItem = {
        _id: itemId,
        itemCode,
        product,
        quantity: Number(quantity),
        mrp: Number(mrp),
        netamt,
      };
      await axios.put("http://localhost:5001/updateItem/" + itemId, updatedItem);
      if (onItemUpdated) {
        onItemUpdated(updatedItem);
      }
      resetForm();
      onClose();
    } catch (err) {
      console.log(err);
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
          <h2 className={headerClassName}>Edit Your Item</h2>
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
        <form className="flex flex-col gap-4" onSubmit={handleEdit}>
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
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditItemsModal;
// ...existing code...

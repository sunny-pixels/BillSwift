import React, { useRef, useState, useEffect } from "react";
import { HiPencilAlt } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import EditItemsModal from "./EditItemsModal";
import axios from "axios";

const Table = ({ items, setItems, highlightedItemId }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Create refs for the highlighted row
  const highlightedRowRef = useRef(null);

  // Scroll to the highlighted row when highlightedItemId changes
  useEffect(() => {
    if (highlightedItemId && highlightedRowRef.current) {
      // Scroll the highlighted row into view with smooth animation
      highlightedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedItemId]);

  const handleDeleteClick = (itemId) => {
    // Confirm before deleting
    axios
      .delete(`http://localhost:5001/deleteItem/${itemId}`)
      .then(() => {
        // After successful deletion, update items state directly
        setItems(items.filter((item) => item._id !== itemId));
      })
      .catch((err) => console.log(err));
  };

  const handleEditClick = (itemId) => {
    setSelectedItemId(itemId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedItemId(null);
  };

  const handleItemUpdated = (updatedItem) => {
    // Update the items array with the updated item
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  return (
    <>
      <div className="w-full rounded-lg shadow-lg border border-[#c4d4d6] text-[12px]">
        <div className="relative max-h-[452px] overflow-y-auto scrollbar-hide border border-[#c4d4d6] rounded-lg">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white text-[#006A71]">
              <tr className="border-b border-[#c4d4d6]">
                <th className="border border-[#c4d4d6] px-6 py-3">No</th>
                <th className="border border-[#c4d4d6] px-6 py-3">Item Code</th>
                <th className="border border-[#c4d4d6] px-6 py-3">Product</th>
                <th className="border border-[#c4d4d6] px-6 py-3">Quantity</th>
                <th className="border border-[#c4d4d6] px-6 py-3">MRP</th>
                <th className="border border-[#c4d4d6] px-6 py-3">
                  Net Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#9ACBD0]">
              {items && items.length > 0 ? (
                items.map((i, index) => {
                  const isHighlighted =
                    i.itemCode === highlightedItemId ||
                    i._id === highlightedItemId;

                  return (
                    <tr
                      key={i.itemCode || i._id}
                      // Set ref conditionally only for the highlighted row
                      ref={isHighlighted ? highlightedRowRef : null}
                      className={`
                      border-b transition-all duration-100  
                      ${
                        isHighlighted
                          ? "bg-[#c4d4d6] font-medium scale-[1.01] shadow-md"
                          : "hover:bg-gray-50"
                      }
                    `}
                    >
                      <td className="border border-[#c4d4d6] px-6 py-3 text-center cursor-pointer group relative">
                        <span>{index + 1}</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <HiPencilAlt
                            onClick={() => handleEditClick(i._id)}
                            className="text-xl cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="border border-[#c4d4d6] px-6 py-3 text-center">
                        {/* {i.itemCode} */}
                        {"MANUAL-" +
                          Math.floor(100000 + Math.random() * 900000)}
                      </td>
                      <td className="border border-[#c4d4d6] px-6 py-3 text-center">
                        {i.product.charAt(0).toUpperCase() + i.product.slice(1)}
                      </td>

                      <td className="border border-[#c4d4d6] px-6 py-3 text-center cursor-pointer group">
                        {/* <div className="flex items-center justify-center space-x-2"> */}
                        {i.quantity}
                        {/* </div> */}
                      </td>

                      <td className="border border-[#c4d4d6] px-6 py-3 text-center cursor-pointer group">
                        {/* <div className="flex items-center justify-center space-x-2"> */}
                        {i.mrp}
                        {/* </div> */}
                      </td>

                      <td className="border border-[#c4d4d6] px-6 py-3 text-center cursor-pointer group">
                        <div className="flex items-center justify-between w-full px-4">
                          <span className="flex-1 text-center">{i.netamt}</span>
                          <MdDelete
                            onClick={() => handleDeleteClick(i._id)}
                            className="text-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        <EditItemsModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          itemId={selectedItemId}
          onItemUpdated={handleItemUpdated}
        />
      </div>

      {/* Add CSS for custom scrollbar */}
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </>
  );
};

export default Table;

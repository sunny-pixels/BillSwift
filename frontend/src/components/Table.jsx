import React, { useRef, useState, useEffect } from "react";
import { HiPencilAlt } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import EditItemsModal from "./EditItemsModal";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL;

const Table = ({ items, setItems, highlightedItemId }) => {
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [editingCell, setEditingCell] = useState({
    row: null,
    column: null,
  });

  const handleDoubleClick = (rowIndex, columnKey) => {
    setEditingCell({ row: rowIndex, column: columnKey });
  };

  const handleChange = (e, rowIndex, columnKey) => {
    const newItems = [...items];
    newItems[rowIndex][columnKey] = e.target.value;

    // Recalculate netamt if quantity or mrp changes
    if (columnKey === "mrp" || columnKey === "quantity") {
      const quantity = parseFloat(newItems[rowIndex].quantity) || 0;
      const mrp = parseFloat(newItems[rowIndex].mrp) || 0;
      newItems[rowIndex].netamt = quantity * mrp;
    }

    setItems(newItems);
  };

  const saveItemUpdate = async (rowIndex) => {
    try {
      const updatedItem = items[rowIndex];
      console.log("Updated Item:", updatedItem);
      await axios.put(`${BASE_URL}/updateItem/${updatedItem._id}`, updatedItem);
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleBlur = () => {
    if (editingCell.row !== null) {
      saveItemUpdate(editingCell.row);
    }
    setEditingCell({ row: null, column: null });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const { row, column } = editingCell;
      const columns = ["product", "quantity", "mrp"];
      const currentIndex = columns.indexOf(column);

      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % columns.length;
        const nextColumn = columns[nextIndex];
        setEditingCell({ row, column: nextColumn });
      }
    }
  };

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
      .delete(`${BASE_URL}/deleteItem/${itemId}`)
      .then(() => {
        // After successful deletion, update items state directly
        setItems(items.filter((item) => item._id !== itemId));
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div className="w-full text-[12px]">
        <div className="max-h-[244px] w-[90%] overflow-y-auto ml-15 mt-10 scrollbar-hide">
          <table className="w-full">
            <thead className="border-2">
              <tr className="text-[#646875]">
                <th className="font-bold text-[15px] px-3 py-3 border-2">No</th>
                <th className="font-bold text-[15px] px-3 py-3 border-2">
                  Item Code
                </th>
                <th className="font-bold text-[15px] px-3 py-3 border-2">
                  Product
                </th>
                <th className="font-bold text-[15px] px-3 py-3 border-2">
                  Quantity
                </th>
                <th className="font-bold text-[15px] px-3 py-3 border-2">
                  MRP
                </th>
                <th className="font-bold text-[15px] px-3 py-3 border-2">
                  Net Amount
                </th>
              </tr>
            </thead>
            <tbody className="">
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
                      transition-all duration-100 border-2 border-[#767c8f] 
                      ${
                        isHighlighted
                          ? "bg-[#0a66e5] font-medium scale-[1.01] shadow-md"
                          : "hover:bg-gray-800"
                      }
                    `}
                    >
                      <td className="px-3 py-3 text-center font-sm text-[15px] text-white cursor-pointer group relative  border-2 border-[#767c8f]">
                        <span>{index + 1}</span>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </td>
                      <td className="px-3 py-3 text-center font-sm text-[15px] text-white border-2 border-[#767c8f]">
                        {/* {i.itemCode} */}
                        {"MANUAL-" +
                          Math.floor(100000 + Math.random() * 900000)}
                      </td>
                      <td
                        onDoubleClick={() =>
                          handleDoubleClick(index, "product")
                        }
                        className="px-3 py-3 text-center font-sm text-[15px] text-white cursor-pointer group border-2 border-[#767c8f]"
                      >
                        {editingCell.row === index &&
                        editingCell.column === "product" ? (
                          <input
                            type="text"
                            value={items[index].product}
                            onChange={(e) => handleChange(e, index, "product")}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="bg-gray-700 text-white w-full text-center outline-none p-0 m-0"
                          />
                        ) : (
                          // Capitalize first letter display when not editing
                          items[index].product.charAt(0).toUpperCase() +
                          items[index].product.slice(1)
                        )}
                      </td>

                      <td
                        onDoubleClick={() =>
                          handleDoubleClick(index, "quantity")
                        }
                        className="px-3 py-3 text-center font-sm text-[15px] text-white cursor-pointer group border-2 border-[#767c8f]"
                      >
                        {editingCell.row === index &&
                        editingCell.column === "quantity" ? (
                          <input
                            type="text"
                            value={items[index].quantity}
                            onChange={(e) => handleChange(e, index, "quantity")}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="bg-gray-700 text-white w-full text-center outline-none"
                          />
                        ) : (
                          items[index].quantity
                        )}
                      </td>

                      <td
                        onDoubleClick={() => handleDoubleClick(index, "mrp")}
                        className="px-3 py-3 text-center font-sm text-[15px] text-white cursor-pointer group border-2 border-[#767c8f]"
                      >
                        {editingCell.row === index &&
                        editingCell.column === "mrp" ? (
                          <input
                            type="text"
                            value={items[index].mrp}
                            onChange={(e) => handleChange(e, index, "mrp")}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="bg-gray-700 text-white w-full text-center outline-none"
                          />
                        ) : (
                          items[index].mrp
                        )}
                      </td>

                      <td className="px-3 py-3 text-center font-sm text-[15px] text-white cursor-pointer group border-2 border-[#767c8f]">
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
          // isOpen={showEditModal}
          // onClose={handleCloseEditModal}
          itemId={selectedItemId}
          items={items}
          // onItemUpdated={handleItemUpdated}
        />
      </div>

      {/* Add CSS for custom scrollbar */}
      <style>{`
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

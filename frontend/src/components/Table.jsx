import React, { useRef, useState, useEffect } from "react";
import { MdDelete } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

const Table = ({
  items,
  setItems,
  highlightedItemId,
  className,
  headerClassName,
  rowClassName,
  highlightClassName,
  iconClassName,
  cellClassName,
  onLastCellTab, // Callback when Tab is pressed on the last cell
}) => {
  const highlightedRowRef = useRef(null);
  const lastInputRef = useRef(null);

  useEffect(() => {
    if (highlightedItemId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedItemId]);

  const handleDeleteClick = async (itemId) => {
    try {
      console.log("Attempting to delete item:", itemId);

      // Find the item to check its status
      const itemToDelete = items.find((item) => item._id === itemId);
      if (!itemToDelete) {
        console.log("Item not found for deletion:", itemId);
        return;
      }

      console.log("Deleting item:", {
        id: itemToDelete._id,
        product: itemToDelete.product,
        isNew: itemToDelete.isNew,
      });

      // First remove from local state immediately for better UX
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));

      // If it's a new item (not yet saved to backend), just remove from local state
      if (itemToDelete.isNew) {
        console.log("New item deleted from local state only");
        return;
      }

      // If it's an existing item, delete from backend
      const response = await axios.delete(`${API_URL}/deleteItem/${itemId}`);
      console.log("Delete response:", response);
    } catch (err) {
      console.error("Failed to delete item:", err);
      // You could add a toast notification here instead of console.log
      // For now, we'll just log the error since the item is already removed from UI
    }
  };

  // Update local state while typing, keep numbers as raw strings for smooth UX
  const updateLocalItemField = (itemId, field, rawValue) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id !== itemId) return item;
        const nextItem = { ...item };

        if (field === "product") {
          nextItem.product = rawValue;
        } else if (field === "quantity") {
          // Keep the raw value as string for display, but ensure it's not undefined
          nextItem.quantity = rawValue === "" ? 0 : rawValue;
        } else if (field === "mrp") {
          // Keep the raw value as string for display, but ensure it's not undefined
          nextItem.mrp = rawValue === "" ? 0 : rawValue;
        }

        // Calculate net amount based on the current values
        const quantity = Number(nextItem.quantity || 0);
        const mrp = Number(nextItem.mrp || 0);
        nextItem.netamt = quantity * mrp;

        return nextItem;
      })
    );
  };

  // Persist the item to backend (called on blur/Enter)
  const saveItemById = async (itemId) => {
    try {
      const item = items.find((x) => x._id === itemId);
      if (!item) return;

      // Check if the item is empty (no product name)
      if (!item.product || item.product.trim() === "") {
        // Remove empty row from local state
        setItems((prev) => prev.filter((it) => it._id !== itemId));
        return;
      }

      // Check if quantity and MRP are valid numbers
      const quantity = Number(item.quantity || 0);
      const mrp = Number(item.mrp || 0);

      if (isNaN(quantity) || isNaN(mrp)) {
        // Don't save if values are invalid, just update local state
        return;
      }

      const payload = {
        itemCode: item.itemCode,
        product: item.product.trim(),
        quantity: quantity,
        mrp: mrp,
        netamt: quantity * mrp,
      };

      if (item.isNew) {
        // Only create if we have valid data
        if (quantity > 0 && mrp > 0) {
          try {
            const response = await axios.post(`${API_URL}/createItem`, payload);
            // Update local state with the real item from backend
            setItems((prev) =>
              prev.map((it) =>
                it._id === itemId ? { ...response.data, isNew: false } : it
              )
            );
          } catch (err) {
            console.log("Failed to create item:", err);
            // Don't remove the row on creation failure, let user retry
            return;
          }
        }
        // If quantity or MRP is 0, keep the item in local state but don't save to backend
      } else {
        // Update existing item
        try {
          await axios.put(`${API_URL}/updateItem/${itemId}`, {
            ...payload,
            _id: itemId,
          });
          // Normalize numbers in local state after save
          setItems((prev) =>
            prev.map((it) => (it._id === itemId ? { ...it, ...payload } : it))
          );
        } catch (err) {
          console.log("Failed to update item:", err);
          // Don't remove the row on update failure, let user retry
          return;
        }
      }
    } catch (err) {
      console.log("Unexpected error:", err);
      // Don't remove the row on unexpected errors
      return;
    }
  };

  const handleLastCellTab = (e) => {
    if (e.shiftKey) return; // Don't handle Shift+Tab
    e.preventDefault();
    if (onLastCellTab) {
      onLastCellTab();
    }
  };

  return (
    <>
      <div className="h-[292px] overflow-y-auto custom-scroll">
        <table className={`sticky-header ${className}`}>
          <thead>
            <tr>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                No
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Product
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Quantity
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                MRP
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Net Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((i, index) => {
                const isHighlighted =
                  i.itemCode === highlightedItemId ||
                  i._id === highlightedItemId;

                // Calculate tabIndex for each input field - start from 2 (after search)
                // Each row has 4 focusable elements: product, quantity, mrp, delete
                const baseTabIndex = 2 + index * 4;
                const productTabIndex = baseTabIndex;
                const quantityTabIndex = baseTabIndex + 1;
                const mrpTabIndex = baseTabIndex + 2;
                const deleteTabIndex = baseTabIndex + 3;

                return (
                  <tr
                    key={i.itemCode || i._id}
                    ref={isHighlighted ? highlightedRowRef : null}
                    className={`group ${rowClassName} ${
                      isHighlighted ? highlightClassName : ""
                    } ${
                      i.isNew
                        ? "bg-[#1a3a5f]/20 border-l-4 border-l-[#3379E9]"
                        : ""
                    }`}
                  >
                    {/* Index cell - light grey, centered */}
                    <td className={`p-0 text-center`}>
                      <div className="w-full h-full px-6 py-4 flex items-center justify-center">
                        <span>{index + 1}</span>
                      </div>
                    </td>

                    {/* Product editable cell */}
                    <td className={`p-0 text-center`}>
                      <input
                        className="w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none"
                        type="text"
                        value={i.product || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateLocalItemField(i._id, "product", value);
                        }}
                        onBlur={() => {
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Move to Add Item button
                              e.preventDefault();
                              if (onLastCellTab) {
                                onLastCellTab();
                              }
                            } else {
                              // Normal Enter: Save and blur
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }
                          // Ctrl + Shift: Quick delete current row and move to Add Item
                          if (e.ctrlKey && e.shiftKey) {
                            e.preventDefault();
                            console.log(
                              "Ctrl+Shift pressed - quick deleting row:",
                              i._id
                            );
                            // Delete the current row
                            setItems((prevItems) =>
                              prevItems.filter((item) => item._id !== i._id)
                            );
                            // Move focus to Add Item button
                            if (onLastCellTab) {
                              onLastCellTab();
                            }
                          }
                        }}
                        placeholder="Product"
                        tabIndex={productTabIndex}
                      />
                    </td>

                    {/* Quantity editable cell */}
                    <td className={`p-0 text-center`}>
                      <input
                        className="w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none"
                        type="number"
                        min="0"
                        step="1"
                        value={i.quantity || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only update if value is valid
                          if (
                            value === "" ||
                            (!isNaN(value) && Number(value) >= 0)
                          ) {
                            updateLocalItemField(i._id, "quantity", value);
                          }
                        }}
                        onBlur={() => {
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Move to Add Item button
                              e.preventDefault();
                              if (onLastCellTab) {
                                onLastCellTab();
                              }
                            } else {
                              // Normal Enter: Save and blur
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }
                          // Ctrl + Shift: Quick delete current row and move to Add Item
                          if (e.ctrlKey && e.shiftKey) {
                            e.preventDefault();
                            console.log(
                              "Ctrl+Shift pressed - quick deleting row:",
                              i._id
                            );
                            // Delete the current row
                            setItems((prevItems) =>
                              prevItems.filter((item) => item._id !== i._id)
                            );
                            // Move focus to Add Item button
                            if (onLastCellTab) {
                              onLastCellTab();
                            }
                          }
                        }}
                        placeholder="Qty"
                        tabIndex={quantityTabIndex}
                      />
                    </td>

                    {/* MRP editable cell */}
                    <td className={`p-0 text-center`}>
                      <input
                        className="w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none"
                        type="number"
                        min="0"
                        step="0.01"
                        value={i.mrp || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only update if value is valid
                          if (
                            value === "" ||
                            (!isNaN(value) && Number(value) >= 0)
                          ) {
                            updateLocalItemField(i._id, "mrp", value);
                          }
                        }}
                        onBlur={() => {
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Move to Add Item button
                              e.preventDefault();
                              if (onLastCellTab) {
                                onLastCellTab();
                              }
                            } else {
                              // Normal Enter: Save and blur
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }
                          // Ctrl + Shift: Quick delete current row and move to Add Item
                          if (e.ctrlKey && e.shiftKey) {
                            e.preventDefault();
                            console.log(
                              "Ctrl+Shift pressed - quick deleting row:",
                              i._id
                            );
                            // Delete the current row
                            setItems((prevItems) =>
                              prevItems.filter((item) => item._id !== i._id)
                            );
                            // Move focus to Add Item button
                            if (onLastCellTab) {
                              onLastCellTab();
                            }
                          }
                        }}
                        placeholder="MRP"
                        tabIndex={mrpTabIndex}
                        ref={index === items.length - 1 ? lastInputRef : null}
                      />
                    </td>

                    {/* Net amount + delete cell - light grey, centered */}
                    <td className={`p-0 text-center relative`}>
                      <div className="w-full h-full px-6 py-4 flex items-center justify-center">
                        <span>{i.netamt}</span>
                        <AiOutlineClose
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(
                              "Delete icon clicked for item:",
                              i._id,
                              "Product:",
                              i.product
                            );
                            handleDeleteClick(i._id);
                          }}
                          className={`${iconClassName} absolute right-4 opacity-0 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] focus:opacity-100`}
                          tabIndex={deleteTabIndex}
                          role="button"
                          aria-label={`Delete item ${i.product}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(
                                "Delete icon activated with keyboard for item:",
                                i._id,
                                "Product:",
                                i.product
                              );
                              handleDeleteClick(i._id);
                            }
                            // Handle Tab from delete icon to next row or Add Item button
                            if (e.key === "Tab" && !e.shiftKey) {
                              e.preventDefault();
                              if (index === items.length - 1) {
                                // Last row, move to Add Item button
                                if (onLastCellTab) {
                                  onLastCellTab();
                                }
                              } else {
                                // Move to next row's product input
                                const nextRowProductInput =
                                  document.querySelector(
                                    `input[tabindex="${2 + (index + 1) * 4}"]`
                                  );
                                if (nextRowProductInput) {
                                  nextRowProductInput.focus();
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className={`${cellClassName} text-center text-[#767c8f]`}
                >
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>
        {`
      .custom-scroll {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE 10+ */
      }
      .custom-scroll::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      .sticky-header th {
        position: sticky;
        top: 0;
        z-index: 2;
      }

      /* Remove spinner arrows from number inputs (Chrome, Safari, Edge) */
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      /* Remove spinner arrows (Firefox) */
      input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
      }
    `}
      </style>
    </>
  );
};

export default Table;

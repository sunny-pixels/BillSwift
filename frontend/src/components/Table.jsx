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

  const handleDeleteClick = (itemId) => {
    axios
      .delete(`${API_URL}/deleteItem/${itemId}`)
      .then(() => {
        setItems(items.filter((item) => item._id !== itemId));
      })
      .catch((err) => console.log(err));
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
          nextItem.quantity = rawValue;
        } else if (field === "mrp") {
          nextItem.mrp = rawValue;
        }
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
      const payload = {
        _id: item._id,
        itemCode: item.itemCode,
        product: item.product,
        quantity: Number(item.quantity) || 0,
        mrp: Number(item.mrp) || 0,
        netamt: (Number(item.quantity) || 0) * (Number(item.mrp) || 0),
      };
      await axios.put(`${API_URL}/updateItem/${itemId}`, payload);
      // Normalize numbers in local state after save
      setItems((prev) =>
        prev.map((it) => (it._id === itemId ? { ...payload } : it))
      );
    } catch (err) {
      console.log(err);
      alert("Failed to save changes. Please try again.");
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
                        onChange={(e) =>
                          updateLocalItemField(i._id, "product", e.target.value)
                        }
                        onBlur={() => saveItemById(i._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
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
                        value={i.quantity ?? 0}
                        onChange={(e) =>
                          updateLocalItemField(
                            i._id,
                            "quantity",
                            e.target.value
                          )
                        }
                        onBlur={() => saveItemById(i._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
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
                        value={i.mrp ?? 0}
                        onChange={(e) =>
                          updateLocalItemField(i._id, "mrp", e.target.value)
                        }
                        onBlur={() => saveItemById(i._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
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
                            e.stopPropagation();
                            handleDeleteClick(i._id);
                          }}
                          className={`${iconClassName} absolute right-4 opacity-0 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] focus:opacity-100`}
                          tabIndex={deleteTabIndex}
                          role="button"
                          aria-label={`Delete item ${i.product}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
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

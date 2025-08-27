import React, { useRef, useState, useEffect } from "react";
// import { MdDelete } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import { AiOutlineCheck } from "react-icons/ai";
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
  onUpdateItem, // Callback for updating items
  onDeleteClick, // Callback for deleting items
  isProductEditable = false, // New prop to control if product field is editable
}) => {
  const highlightedRowRef = useRef(null);
  const lastInputRef = useRef(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // State to track which field is focused for new rows
  const [editingItemId, setEditingItemId] = useState(null);
  
  // Toast notification component
  const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 500);

      return () => clearTimeout(timer);
    }, [onClose]);

    const getToastStyles = () => {
      if (type === "error" || message.includes("deleted")) {
        return {
          bg: "bg-black",
          shadow: "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          border: "border-black/20",
        };
      }
      return {
        bg: "bg-[#0a66e5]",
        shadow: "shadow-[0_8px_32px_rgba(10,102,229,0.3)]",
        border: "border-[#3379E9]/20",
      };
    };

    const styles = getToastStyles();

    return (
      <div className="fixed top-6 right-6 z-50">
        <div
          className={`${styles.bg} px-6 py-4 rounded-[16px] ${styles.shadow} text-white font-medium flex items-center gap-3 border ${styles.border} backdrop-blur-sm`}
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm">{message}</span>
        </div>
      </div>
    );
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "success" });
  };

  useEffect(() => {
    if (highlightedItemId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedItemId]);

  // Auto-scroll to new items when they're added
  useEffect(() => {
    const newItems = items.filter((item) => item.isNew);
    if (newItems.length > 0) {
      const lastNewItem = newItems[newItems.length - 1];
      const newItemRow = document.querySelector(
        `[data-item-id="${lastNewItem._id}"]`
      );
      if (newItemRow) {
        setTimeout(() => {
          newItemRow.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 50);
      }
    }
  }, [items]);

  const handleDeleteClick = async (itemId) => {
    // If onDeleteClick prop is provided, use it
    if (onDeleteClick) {
      onDeleteClick(itemId);
      return;
    }

    // Fallback to internal delete logic
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
      if (onUpdateItem) {
        // Use the callback to remove the item
        const updatedItems = items.filter((item) => item._id !== itemId);
        setItems(updatedItems);
      } else {
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
      }

      // Show success message
      showToast("Item deleted successfully!", "success");

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
      // Show error message if deletion fails
      showToast("Failed to delete item. Please try again.", "error");
    }
  };

  // Update local state while typing, keep numbers as raw strings for smooth UX
  const updateLocalItemField = (itemId, field, rawValue) => {
    // Use onUpdateItem callback if available, otherwise use local setItems
    if (onUpdateItem) {
      const item = items.find((item) => item._id === itemId);
      if (item) {
        const updatedItem = { ...item };
        
        if (field === "product") {
          updatedItem.product = rawValue;
        } else if (field === "quantity") {
          updatedItem.quantity = rawValue === "" ? 0 : rawValue;
        } else if (field === "mrp") {
          updatedItem.mrp = rawValue === "" ? 0 : rawValue;
        }

        // Calculate net amount based on the current values
        const quantity = Number(updatedItem.quantity || 0);
        const mrp = Number(updatedItem.mrp || 0);
        updatedItem.netamt = quantity * mrp;

        onUpdateItem(itemId, updatedItem);
      }
    } else {
      // Fallback to local state management
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
    }
  };

  // Persist the item to backend (called on blur/Enter)
  const saveItemById = async (itemId) => {
    try {
      console.log("saveItemById called with itemId:", itemId);
      console.log("API_URL:", API_URL);
      const item = items.find((x) => x._id === itemId);
      if (!item) {
        console.log("Item not found:", itemId);
        return Promise.resolve({ success: false });
      }
      console.log("Found item:", item);

      // Check if the item is empty (no product name)
      if (!item.product || item.product.trim() === "") {
        // Remove empty row from local state
        if (onUpdateItem) {
          // Use the callback to remove the item
          const updatedItems = items.filter((it) => it._id !== itemId);
          // Update the parent component's state
          setItems(updatedItems);
        } else {
        setItems((prev) => prev.filter((it) => it._id !== itemId));
        }
        return Promise.resolve({ success: false });
      }

      // Check if quantity and MRP are valid numbers
      const quantity = Number(item.quantity || 0);
      const mrp = Number(item.mrp || 0);

      console.log("Converted values - quantity:", quantity, "mrp:", mrp, "isNaN quantity:", isNaN(quantity), "isNaN mrp:", isNaN(mrp));

      if (isNaN(quantity) || isNaN(mrp)) {
        console.log("Invalid numbers detected");
        // Don't save if values are invalid, just update local state
        return Promise.resolve({ success: false });
      }

      const payload = {
        itemCode: item.itemCode,
        product: item.product.trim(),
        quantity: quantity,
        mrp: mrp,
        netamt: quantity * mrp,
      };
      
      console.log("Payload to be sent:", payload);

      // Update existing item
      try {
        await axios.put(`${API_URL}/updateItem/${itemId}`, {
          ...payload,
          _id: itemId,
        });
        // Normalize numbers in local state after save, preserving display values
        const updatedItem = {
          ...item,
          ...payload,
          // Ensure the display values are preserved
          product: item.product,
          quantity: item.quantity,
          mrp: item.mrp,
          netamt: item.netamt,
        };
        
        if (onUpdateItem) {
          onUpdateItem(itemId, updatedItem);
        } else {
        setItems((prev) =>
          prev.map((it) =>
              it._id === itemId ? updatedItem : it
            )
          );
        }
        return Promise.resolve({ success: true });
      } catch (err) {
        console.log("Failed to update item:", err);
        // Don't remove the row on update failure, let user retry
        return Promise.resolve({ success: false });
      }
    } catch (err) {
      console.log("Unexpected error:", err);
      // Don't remove the row on unexpected errors
      return Promise.resolve({ success: false });
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
      {/* Toast Notification */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <table className={`${className} w-full table-fixed`}>
          <thead>
            <tr>
            <th className={`${cellClassName} ${headerClassName} text-center w-[10%]`}>
                No
              </th>
            <th className={`${cellClassName} ${headerClassName} text-center w-[30%]`}>
                Product
              </th>
            <th className={`${cellClassName} ${headerClassName} text-center w-[20%]`}>
                Quantity
              </th>
            <th className={`${cellClassName} ${headerClassName} text-center w-[20%]`}>
                MRP
              </th>
            <th className={`${cellClassName} ${headerClassName} text-center w-[20%]`}>
                Net Amount
              </th>
            </tr>
          </thead>
      </table>
      <div className="h-[292px] overflow-y-auto custom-scroll">
        <table className={`${className} w-full table-fixed`}>
          <tbody>
            {items && items.length > 0 ? (
              items.map((i, index) => {
                const isHighlighted =
                  highlightedItemId && (
                  i.itemCode === highlightedItemId ||
                    i._id === highlightedItemId
                  );

                // Calculate tabIndex for each input field - start from 2 (after search)
                // Each row has 2-3 focusable elements: product (if editable), quantity, mrp
                const focusableFieldsPerRow = isProductEditable ? 3 : 2;
                const baseTabIndex = 2 + index * focusableFieldsPerRow;
                const productTabIndex = isProductEditable ? baseTabIndex : null;
                const quantityTabIndex = isProductEditable ? baseTabIndex + 1 : baseTabIndex;
                const mrpTabIndex = isProductEditable ? baseTabIndex + 2 : baseTabIndex + 1;

                return (
                  <tr
                    key={i.itemCode || i._id}
                    ref={isHighlighted ? highlightedRowRef : null}
                    data-item-id={i._id}
                    className={`group ${rowClassName} ${
                      isHighlighted ? highlightClassName : ""
                    } hover:bg-[#1a3a5f]/20 transition-all duration-200 ${
                      editingItemId === i._id ? "bg-blue-50/10" : ""
                    }`}
                  >
                    {/* Index cell - light grey, centered */}
                    <td className={`p-0 text-center w-[10%]`}>
                      <div className="w-full h-full px-6 py-4 flex items-center justify-center">
                        <span>{index + 1}</span>
                      </div>
                    </td>

                    {/* Product cell - editable or read-only based on isProductEditable prop */}
                    <td className={`p-0 text-center w-[30%]`}>
                      {isProductEditable ? (
                        <input
                          className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                            editingItemId === i._id ? "bg-blue-50/20" : ""
                          }`}
                          type="text"
                          value={i.product || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateLocalItemField(i._id, "product", value);
                          }}
                          onFocus={() => {
                            // Track which field is focused
                            setEditingItemId(i._id);
                          }}
                          onBlur={() => {
                            // Reset focused field
                            // Remove from editing items immediately
                            setEditingItemId(null);
                            // Only save if we have a product name
                            if (i.product && i.product.trim() !== "") {
                              saveItemById(i._id);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Alt+WASD navigation for product field
                            if (e.altKey) {
                              const step = (isProductEditable ? 3 : 2);
                              if (e.key.toLowerCase() === "w") {
                                e.preventDefault();
                                if (index > 0) {
                                  const prevBase = 2 + (index - 1) * step;
                                  const prevRowInput = document.querySelector(
                                    `input[tabindex="${prevBase}"]`
                                  );
                                  if (prevRowInput) {
                                    prevRowInput.focus();
                                  }
                                }
                                return;
                              }
                              if (e.key.toLowerCase() === "s") {
                                e.preventDefault();
                                if (index < items.length - 1) {
                                  const nextBase = 2 + (index + 1) * step;
                                  const nextRowInput = document.querySelector(
                                    `input[tabindex="${nextBase}"]`
                                  );
                                  if (nextRowInput) {
                                    nextRowInput.focus();
                                  }
                                }
                                return;
                              }
                              if (e.key.toLowerCase() === "d") {
                                e.preventDefault();
                                // Move right to quantity in the same row
                                const right = document.querySelector(
                                  `input[tabindex="${quantityTabIndex}"]`
                                );
                                if (right) { right.focus(); }
                                return;
                              }
                              if (e.key.toLowerCase() === "a") {
                                e.preventDefault();
                                // No left from product
                                return;
                              }
                            }
                            // Disable ArrowUp/ArrowDown hotkeys
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                              e.preventDefault();
                              return;
                            }

                            // ESC key: Delete new row if it's incomplete
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingItemId(null);
                              return;
                            }

                            if (e.key === "Enter") {
                              if (e.shiftKey) {
                                // Shift + Enter: Create new row
                                e.preventDefault();

                                // Add new empty row
                                const newItem = {
                                  _id: `temp_${Date.now()}`,
                                  itemCode: `ITEM${items.length + 1}`,
                                  product: "",
                                  quantity: "",
                                  mrp: "",
                                  netamt: 0,
                                };
                                setItems((prevItems) => [...prevItems, newItem]);
                              } else {
                                // Normal Enter: Save and move to quantity field
                                e.preventDefault();
                                const quantityInput = document.querySelector(
                                  `input[tabindex="${quantityTabIndex}"]`
                                );
                                if (quantityInput) {
                                  quantityInput.focus();
                                }
                                // Notify user with column name
                                showToast("Product value updated", "success");
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
                      ) : (
                      <div className="w-full h-full px-6 py-4 text-center flex items-center justify-center">
                        <span className="text-sm font-medium">{i.product || ""}</span>
                      </div>
                      )}
                    </td> 
                    {/* Quantity editable cell */}
                    <td className={`p-0 text-center w-[20%]`}>
                      <input
                        className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                          editingItemId === i._id ? "bg-blue-50/20" : ""
                        }`}
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
                        onFocus={() => {
                          // Track which field is focused for new rows
                          setEditingItemId(i._id);
                        }}
                        onBlur={() => {
                          // Reset focused field
                          // Remove from editing items immediately
                          setEditingItemId(null);
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          // Alt+WASD navigation for quantity field
                          if (e.altKey) {
                            const step = (isProductEditable ? 3 : 2);
                            if (e.key.toLowerCase() === "w") {
                              e.preventDefault();
                              if (index > 0) {
                                const prevBase = 2 + (index - 1) * step;
                                const target = isProductEditable ? prevBase + 1 : prevBase;
                                const prevRowInput = document.querySelector(
                                  `input[tabindex="${target}"]`
                                );
                                if (prevRowInput) {
                                  prevRowInput.focus();
                                }
                              }
                              return;
                            }
                            if (e.key.toLowerCase() === "s") {
                              e.preventDefault();
                              if (index < items.length - 1) {
                                const nextBase = 2 + (index + 1) * step;
                                const target = isProductEditable ? nextBase + 1 : nextBase;
                                const nextRowInput = document.querySelector(
                                  `input[tabindex="${target}"]`
                                );
                                if (nextRowInput) {
                                  nextRowInput.focus();
                                }
                              }
                              return;
                            }
                            if (e.key.toLowerCase() === "a") {
                              e.preventDefault();
                              // Move left to product if editable
                              if (isProductEditable) {
                                const left = document.querySelector(
                                  `input[tabindex="${productTabIndex}"]`
                                );
                                if (left) { left.focus(); }
                              }
                              return;
                            }
                            if (e.key.toLowerCase() === "d") {
                              e.preventDefault();
                              // Move right to mrp
                              const right = document.querySelector(
                                `input[tabindex="${mrpTabIndex}"]`
                              );
                              if (right) { right.focus(); }
                              return;
                            }
                          }
                          // Disable ArrowUp/ArrowDown hotkeys
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                            return;
                          }

                          // ESC key: Delete new row if it's incomplete
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingItemId(null);
                            return;
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row
                              e.preventDefault();

                              // Add new empty row
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${items.length + 1}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's quantity input after a short delay
                              setTimeout(() => {
                                const newRowQuantityInput =
                                  document.querySelector(
                                    `input[tabindex="${2 + items.length * 2}"]`
                                  );
                                if (newRowQuantityInput) {
                                  newRowQuantityInput.focus();
                                  // Scroll to ensure the new row is visible
                                  newRowQuantityInput.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }
                              }, 100);
                            } else {
                              // Normal Enter: Save and move to next field
                              e.preventDefault();
                              if (isProductEditable) {
                                // Move to MRP field when product is editable
                              const mrpInput = document.querySelector(
                                `input[tabindex="${mrpTabIndex}"]`
                              );
                              if (mrpInput) {
                                mrpInput.focus();
                                }
                              } else {
                                // Move to MRP field when product is not editable
                                const mrpInput = document.querySelector(
                                  `input[tabindex="${mrpTabIndex}"]`
                                );
                                if (mrpInput) {
                                  mrpInput.focus();
                                }
                              }
                              // Notify user
                              showToast("Quantity value updated", "success");
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
                    <td className={`p-0 text-center w-[20%]`}>
                      <input
                        className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                          editingItemId === i._id ? "bg-blue-50/20" : ""
                        }`}
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
                        onFocus={() => {
                          // Track which field is focused for new rows
                          setEditingItemId(i._id);
                        }}
                        onBlur={() => {
                          // Reset focused field
                          // Remove from editing items immediately
                          setEditingItemId(null);
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          // Alt+WASD navigation for mrp field
                          if (e.altKey) {
                            const step = (isProductEditable ? 3 : 2);
                            if (e.key.toLowerCase() === "w") {
                              e.preventDefault();
                              if (index > 0) {
                                const prevBase = 2 + (index - 1) * step;
                                const target = isProductEditable ? prevBase + 2 : prevBase + 1;
                                const prevRowInput = document.querySelector(
                                  `input[tabindex="${target}"]`
                                );
                                if (prevRowInput) {
                                  prevRowInput.focus();
                                }
                              }
                              return;
                            }
                            if (e.key.toLowerCase() === "s") {
                              e.preventDefault();
                              if (index < items.length - 1) {
                                const nextBase = 2 + (index + 1) * step;
                                const target = isProductEditable ? nextBase + 2 : nextBase + 1;
                                const nextRowInput = document.querySelector(
                                  `input[tabindex="${target}"]`
                                );
                                if (nextRowInput) {
                                  nextRowInput.focus();
                                }
                              }
                              return;
                            }
                            if (e.key.toLowerCase() === "a") {
                              e.preventDefault();
                              // Move left to quantity
                              const left = document.querySelector(
                                `input[tabindex="${quantityTabIndex}"]`
                              );
                              if (left) { left.focus(); }
                              return;
                            }
                            if (e.key.toLowerCase() === "d") {
                              e.preventDefault();
                              // No right from mrp
                              return;
                            }
                          }
                          // Disable ArrowUp/ArrowDown hotkeys
                          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                            e.preventDefault();
                            return;
                          }

                          // ESC key: Delete new row if it's incomplete
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingItemId(null);
                            return;
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row
                              e.preventDefault();

                              // Add new empty row
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${items.length + 1}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's quantity input after a short delay
                              setTimeout(() => {
                                const newRowQuantityInput =
                                  document.querySelector(
                                    `input[tabindex="${2 + items.length * 2}"]`
                                  );
                                if (newRowQuantityInput) {
                                  newRowQuantityInput.focus();
                                  // Scroll to ensure the new row is visible
                                  newRowQuantityInput.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }
                              }, 100);
                            } else {
                              // Normal Enter: Save and show MRP toast for both new and existing items
                              e.preventDefault();
                              saveItemById(i._id).then(() => {
                                showToast("MRP value updated", "success");
                                if (index === items.length - 1) {
                                  // Last row: Move to search bar
                                  if (onLastCellTab) {
                                    onLastCellTab();
                                  }
                                } else {
                                  // Not last row: Move to next row's first input field
                                  const nextRowFirstInput = document.querySelector(
                                    `input[tabindex="${2 + (index + 1) * (isProductEditable ? 3 : 2)}"]`
                                  );
                                  if (nextRowFirstInput) {
                                    nextRowFirstInput.focus();
                                    // Scroll to ensure the next row is visible
                                    nextRowFirstInput.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                  }
                                }
                              });
                            }
                          }
                          
                          // Tab key: Move to tick button
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            const tickButton = document.querySelector(
                              `[tabindex="${baseTabIndex + (isProductEditable ? 3 : 2)}"]`
                            );
                            if (tickButton) {
                              tickButton.focus();
                            }
                            return;
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
                            // Move focus to search bar
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

                    {/* Net amount + action cell - light grey, centered */}
                    <td className={`p-0 text-center relative w-[20%]`}>
                      <div className="w-full h-full px-6 py-4 flex items-center justify-center">
                        <span>{i.netamt}</span>
                        {editingItemId === i._id ? (
                          <AiOutlineCheck
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("Save button clicked for item:", i._id);
                              const result = await saveItemById(i._id);
                              if (result.success) {
                                const header = "Value";
                                showToast(`${header} value updated`, "success");
                                setEditingItemId(null);
                              }
                            }}
                            className={`absolute right-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] text-gray-400 hover:text-green-500 focus:text-green-500 opacity-100`}
                            tabIndex={baseTabIndex + (isProductEditable ? 3 : 2)}
                            role="button"
                            aria-label={`Save changes for item ${i.product}`}
                            onFocus={() => {
                              // Ensure editing state is maintained when tick button gets focus
                              setEditingItemId(i._id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Save button activated with keyboard for item:", i._id);
                                saveItemById(i._id).then((result) => {
                                  if (result.success) {
                                    const header = "Value";
                                    showToast(`${header} value updated`, "success");
                                  }
                                });
                              }
                              
                              // Arrow key navigation for tick button
                              if (e.key === "ArrowUp") {
                                e.preventDefault();
                                if (index > 0) {
                                  // Move to previous row's tick button
                                  const prevRowTick = document.querySelector(
                                    `[tabindex="${baseTabIndex - (isProductEditable ? 3 : 2)}"]`
                                  );
                                  if (prevRowTick) {
                                    prevRowTick.focus();
                                  }
                                }
                              }
                              
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                if (index < items.length - 1) {
                                  // Move to next row's tick button
                                  const nextRowTick = document.querySelector(
                                    `[tabindex="${baseTabIndex + (isProductEditable ? 3 : 2)}"]`
                                  );
                                  if (nextRowTick) {
                                    nextRowTick.focus();
                                  }
                                }
                              }
                             
                             // Handle Tab from tick button to next row or Connect WhatsApp button
                             if (e.key === "Tab" && !e.shiftKey) {
                               e.preventDefault();
                               console.log("Tab pressed from tick button, index:", index, "items.length:", items.length);
                               if (index === items.length - 1) {
                                 // Last row, move to Connect WhatsApp button
                                 console.log("Last row, calling onLastCellTab");
                                 if (onLastCellTab) {
                                   onLastCellTab();
                                 }
                               } else {
                                 // Move to next row's first input field
                                 console.log("Not last row, moving to next row");
                                 const nextRowFirstInput =
                                   document.querySelector(
                                     `input[tabindex="${2 + (index + 1) * (isProductEditable ? 3 : 2)}"]`
                                   );
                                 if (nextRowFirstInput) {
                                   nextRowFirstInput.focus();
                                 }
                               }
                             }
                            }}
                          />
                        ) : (
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
                            className={`absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] focus:opacity-100 text-gray-400 hover:text-red-500`}
                            tabIndex={baseTabIndex + (isProductEditable ? 3 : 2)}
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
                                  // Move to next row's first input field
                                  const nextRowFirstInput =
                                    document.querySelector(
                                      `input[tabindex="${2 + (index + 1) * (isProductEditable ? 3 : 2)}"]`
                                    );
                                  if (nextRowFirstInput) {
                                    nextRowFirstInput.focus();
                                  }
                                }
                              }
                            }}
                          />
                        )}
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
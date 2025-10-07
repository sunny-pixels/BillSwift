import React, { useRef, useState, useEffect } from "react";
// import { MdDelete } from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";
import { AiOutlineCheck } from "react-icons/ai";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

const BillTable = ({
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
  isProductEditable = false, // Bill table has non-editable product field by default
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
  const [focusedField, setFocusedField] = useState(null); // Track which field is focused

  // State to track original values for change detection
  const [originalValues, setOriginalValues] = useState({});

  // Toast notification component
  const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);

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

  // Debug logging for items
  useEffect(() => {
    console.log("BillTable - Received items:", items);
    console.log("BillTable - Items length:", items?.length || 0);
  }, [items]);

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
        setItems((prevItems) =>
          prevItems.filter((item) => item._id !== itemId)
        );
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

  // Check if an item has been modified from its original values
  const hasItemChanged = (itemId) => {
    const item = items.find((item) => item._id === itemId);
    const original = originalValues[itemId];

    if (!item || !original) return false;

    return (
      item.product !== original.product ||
      Number(item.quantity || 0) !== Number(original.quantity || 0) ||
      Number(item.mrp || 0) !== Number(original.mrp || 0)
    );
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
        const toOneDecimalTrunc = (v) => Math.trunc(Number(v) * 10) / 10;
        updatedItem.netamt = toOneDecimalTrunc(quantity * mrp);

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
          const toOneDecimalTrunc = (v) => Math.trunc(Number(v) * 10) / 10;
          nextItem.netamt = toOneDecimalTrunc(quantity * mrp);

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

      // For new items, check if all required fields are filled
      if (item.isNew) {
        const quantity = Number(item.quantity || 0);
        const mrp = Number(item.mrp || 0);

        if (
          !item.product ||
          item.product.trim() === "" ||
          quantity <= 0 ||
          mrp <= 0
        ) {
          // Don't save incomplete new items
          return Promise.resolve({ success: false });
        }
      } else {
        // For existing items, check if anything has actually changed
        if (!hasItemChanged(itemId)) {
          console.log("No changes detected for existing item, skipping save");
          return Promise.resolve({ success: false });
        }
      }

      // Check if quantity and MRP are valid numbers
      const quantity = Number(item.quantity || 0);
      const mrp = Number(item.mrp || 0);

      console.log(
        "Converted values - quantity:",
        quantity,
        "mrp:",
        mrp,
        "isNaN quantity:",
        isNaN(quantity),
        "isNaN mrp:",
        isNaN(mrp)
      );

      if (isNaN(quantity) || isNaN(mrp)) {
        console.log("Invalid numbers detected");
        // Don't save if values are invalid, just update local state
        return Promise.resolve({ success: false });
      }

      const payload = {
        itemCode: item.itemCode || `ITEM${Date.now()}`, // Ensure unique itemCode
        product: item.product.trim(),
        quantity: quantity,
        mrp: mrp,
        netamt: Math.trunc(quantity * mrp * 10) / 10,
      };

      console.log("Payload to be sent:", payload);

      // Check if this is a new item or existing item
      if (item.isNew) {
        // Create new item
        try {
          const response = await axios.post(`${API_URL}/createItem`, payload);
          console.log("New item created:", response.data);

          // Update local state with the new item data from server
          const newItem = {
            ...item,
            ...response.data, // Use the data returned from server
            isNew: false, // Remove the isNew flag after successful save
          };

          if (onUpdateItem) {
            onUpdateItem(itemId, newItem);
          } else {
            setItems((prev) =>
              prev.map((it) => (it._id === itemId ? newItem : it))
            );
          }

          // Clear original values after successful save for new items
          setOriginalValues((prev) => {
            const newValues = { ...prev };
            delete newValues[itemId];
            return newValues;
          });

          return Promise.resolve({ success: true });
        } catch (err) {
          console.log("Failed to create new item:", err);
          // Don't remove the row on creation failure, let user retry
          return Promise.resolve({ success: false });
        }
      } else {
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
            isNew: false, // Remove the isNew flag after successful save
          };

          if (onUpdateItem) {
            onUpdateItem(itemId, updatedItem);
          } else {
            setItems((prev) =>
              prev.map((it) => (it._id === itemId ? updatedItem : it))
            );
          }

          // Clear original values after successful save for existing items
          setOriginalValues((prev) => {
            const newValues = { ...prev };
            delete newValues[itemId];
            return newValues;
          });

          return Promise.resolve({ success: true });
        } catch (err) {
          console.log("Failed to update item:", err);
          // Don't remove the row on update failure, let user retry
          return Promise.resolve({ success: false });
        }
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
            <th
              className={`${cellClassName} ${headerClassName} text-center w-[10%]`}
            >
              No
            </th>
            <th
              className={`${cellClassName} ${headerClassName} text-center w-[30%]`}
            >
              Product
            </th>
            <th
              className={`${cellClassName} ${headerClassName} text-center w-[20%]`}
            >
              Quantity
            </th>
            <th
              className={`${cellClassName} ${headerClassName} text-center w-[20%]`}
            >
              MRP
            </th>
            <th
              className={`${cellClassName} ${headerClassName} text-center w-[20%]`}
            >
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
                  highlightedItemId &&
                  (i.itemCode === highlightedItemId ||
                    i._id === highlightedItemId);

                // Calculate tabIndex for each input field - only for new items in bill table
                // Each row has 2-3 focusable elements: product (if editable), quantity, mrp
                const focusableFieldsPerRow = isProductEditable ? 3 : 2;
                const newItemIndex = items
                  .slice(0, index)
                  .filter((item) => item.isNew).length;
                const baseTabIndex = i.isNew
                  ? 2 + newItemIndex * focusableFieldsPerRow
                  : -1;
                const productTabIndex =
                  isProductEditable && i.isNew
                    ? baseTabIndex
                    : i.isNew
                    ? -1
                    : null;
                const quantityTabIndex = i.isNew
                  ? isProductEditable
                    ? baseTabIndex + 1
                    : baseTabIndex
                  : -1;
                const mrpTabIndex = i.isNew
                  ? isProductEditable
                    ? baseTabIndex + 2
                    : baseTabIndex + 1
                  : -1;

                return (
                  <tr
                    key={i.itemCode || i._id}
                    ref={isHighlighted ? highlightedRowRef : null}
                    data-item-id={i._id}
                    className={`group ${rowClassName} ${
                      isHighlighted ? highlightClassName : ""
                    } hover:bg-[#1a3a5f]/20 transition-all duration-200 ${
                      editingItemId === i._id ? "bg-blue-50/10" : ""
                    } ${i.isNew ? "bg-blue-50/5" : ""}`}
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
                          } ${i.isNew ? "bg-blue-50/10" : ""}`}
                          type="text"
                          value={i.product || ""}
                          data-item-id={i.itemCode || i._id}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateLocalItemField(i._id, "product", value);
                          }}
                          onFocus={() => {
                            // Track which field is focused
                            setEditingItemId(i._id);
                            setFocusedField("product");

                            // Store original values for existing items when first focused
                            if (!i.isNew && !originalValues[i._id]) {
                              setOriginalValues((prev) => ({
                                ...prev,
                                [i._id]: {
                                  product: i.product || "",
                                  quantity: i.quantity || 0,
                                  mrp: i.mrp || 0,
                                },
                              }));
                            }
                          }}
                          onBlur={() => {
                            // Don't immediately reset editing state for new items
                            // Only reset if it's not a new item or if we're moving to another field
                            if (!i.isNew) {
                              setEditingItemId(null);
                              setFocusedField(null);
                            }
                            // For new items, only save if the item is complete (has product, quantity, and MRP)
                            if (
                              i.isNew &&
                              i.product &&
                              i.product.trim() !== "" &&
                              i.quantity &&
                              i.quantity > 0 &&
                              i.mrp &&
                              i.mrp > 0
                            ) {
                              saveItemById(i._id).then((result) => {
                                if (result.success) {
                                  showToast(
                                    "New item added successfully!",
                                    "success"
                                  );
                                  // Only reset editing state after successful save
                                  setEditingItemId(null);
                                  setFocusedField(null);
                                }
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            // Alt+WASD navigation for product field
                            if (e.altKey) {
                              const step = isProductEditable ? 3 : 2;
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
                                if (right) {
                                  right.focus();
                                }
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
                              if (i.isNew) {
                                // Delete the new incomplete row
                                setItems((prevItems) =>
                                  prevItems.filter((item) => item._id !== i._id)
                                );
                                showToast("New item discarded", "success");
                              }
                              setEditingItemId(null);
                              setFocusedField(null);
                              return;
                            }

                            if (e.key === "Enter") {
                              if (e.shiftKey) {
                                // Shift + Enter: Create new row
                                e.preventDefault();
                                e.stopPropagation(); // Prevent global handler from triggering

                                // Add new empty row
                                const newItem = {
                                  _id: `temp_${Date.now()}`,
                                  itemCode: `ITEM${Date.now()}`,
                                  product: "",
                                  quantity: "",
                                  mrp: "",
                                  netamt: 0,
                                  isNew: true,
                                };
                                setItems((prevItems) => [
                                  ...prevItems,
                                  newItem,
                                ]);
                              } else {
                                // Normal Enter: Save and move to quantity field
                                e.preventDefault();

                                // Only save if there are actual changes for existing items
                                if (i.isNew || hasItemChanged(i._id)) {
                                  saveItemById(i._id).then((result) => {
                                    if (result.success) {
                                      showToast("Value updated", "success");
                                    }
                                  });
                                }

                                const quantityInput = document.querySelector(
                                  `input[tabindex="${quantityTabIndex}"]`
                                );
                                if (quantityInput) {
                                  quantityInput.focus();
                                }
                              }
                            }
                            // Delete key: Quick delete current row and move to Add Item
                            if (e.key === "Delete") {
                              e.preventDefault();
                              console.log(
                                "Delete pressed - quick deleting row:",
                                i._id
                              );
                              // Delete the current row
                              setItems((prevItems) =>
                                prevItems.filter((item) => item._id !== i._id)
                              );
                              // Show success message
                              showToast(
                                "Item deleted successfully!",
                                "success"
                              );
                              // Move focus to Add Item button
                              if (onLastCellTab) {
                                onLastCellTab();
                              }
                              return;
                            }
                          }}
                          placeholder="Product"
                          tabIndex={productTabIndex}
                        />
                      ) : (
                        <div className="w-full h-full px-6 py-4 text-center flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {i.product || ""}
                          </span>
                        </div>
                      )}
                    </td>
                    {/* Quantity editable cell */}
                    <td className={`p-0 text-center w-[20%]`}>
                      <input
                        className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                          editingItemId === i._id ? "bg-blue-50/20" : ""
                        } ${i.isNew ? "bg-blue-50/10" : ""}`}
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
                          setFocusedField("quantity");

                          // Store original values for existing items when first focused
                          if (!i.isNew && !originalValues[i._id]) {
                            setOriginalValues((prev) => ({
                              ...prev,
                              [i._id]: {
                                product: i.product || "",
                                quantity: i.quantity || 0,
                                mrp: i.mrp || 0,
                              },
                            }));
                          }
                        }}
                        onBlur={() => {
                          // Don't immediately reset editing state for new items
                          // Only reset if it's not a new item or if we're moving to another field
                          if (!i.isNew) {
                            setEditingItemId(null);
                            setFocusedField(null);
                          }
                          // Do not auto-save on blur; save only on Enter as per flow
                          // Do not auto-save on blur; save only on Enter as per flow
                        }}
                        onKeyDown={(e) => {
                          // Alt+WASD navigation for quantity field
                          if (e.altKey) {
                            const step = isProductEditable ? 3 : 2;
                            if (e.key.toLowerCase() === "w") {
                              e.preventDefault();
                              if (index > 0) {
                                const prevBase = 2 + (index - 1) * step;
                                const target = isProductEditable
                                  ? prevBase + 1
                                  : prevBase;
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
                                const target = isProductEditable
                                  ? nextBase + 1
                                  : nextBase;
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
                                if (left) {
                                  left.focus();
                                }
                              }
                              return;
                            }
                            if (e.key.toLowerCase() === "d") {
                              e.preventDefault();
                              // Move right to mrp
                              const right = document.querySelector(
                                `input[tabindex="${mrpTabIndex}"]`
                              );
                              if (right) {
                                right.focus();
                              }
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
                            if (i.isNew) {
                              // Delete the new incomplete row
                              setItems((prevItems) =>
                                prevItems.filter((item) => item._id !== i._id)
                              );
                              showToast("New item discarded", "success");
                            }
                            setEditingItemId(null);
                            setFocusedField(null);
                            return;
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row
                              e.preventDefault();

                              // Add new empty row
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${Date.now()}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                                isNew: true,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's quantity input after a short delay
                              setTimeout(() => {
                                const step = isProductEditable ? 3 : 2;
                                const newRowQuantityInput =
                                  document.querySelector(
                                    `input[tabindex="${
                                      2 + items.length * step
                                    }"]`
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

                              // Only save if there are actual changes for existing items
                              if (i.isNew || hasItemChanged(i._id)) {
                                saveItemById(i._id).then((result) => {
                                  if (result.success) {
                                    showToast("Value updated", "success");
                                  }
                                });
                              }

                              // Small delay to prevent focus loss
                              setTimeout(() => {
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
                              }, 10);
                            }
                          }

                          // Tab key: Only move to next field for new items
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();

                            // Only allow Tab traversal for new items
                            if (i.isNew) {
                              // Small delay to prevent focus loss
                              setTimeout(() => {
                                // Move to MRP field
                                const mrpInput = document.querySelector(
                                  `input[tabindex="${mrpTabIndex}"]`
                                );
                                if (mrpInput) {
                                  mrpInput.focus();
                                }
                              }, 10);
                            }
                            return;
                          }

                          // Delete key: Quick delete current row and move to Add Item
                          if (e.key === "Delete") {
                            e.preventDefault();
                            console.log(
                              "Delete pressed - quick deleting row:",
                              i._id
                            );
                            // Delete the current row
                            setItems((prevItems) =>
                              prevItems.filter((item) => item._id !== i._id)
                            );
                            // Show success message
                            showToast("Item deleted successfully!", "success");
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
                        } ${i.isNew ? "bg-blue-50/10" : ""}`}
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
                          setFocusedField("mrp");

                          // Store original values for existing items when first focused
                          if (!i.isNew && !originalValues[i._id]) {
                            setOriginalValues((prev) => ({
                              ...prev,
                              [i._id]: {
                                product: i.product || "",
                                quantity: i.quantity || 0,
                                mrp: i.mrp || 0,
                              },
                            }));
                          }
                        }}
                        onBlur={() => {
                          // Don't immediately reset editing state for new items
                          // Only reset if it's not a new item or if we're moving to another field
                          if (!i.isNew) {
                            setEditingItemId(null);
                            setFocusedField(null);
                          }
                          // Note: Removed automatic save on blur for MRP field
                          // Items should only be saved on Enter key press, not on Tab/blur
                        }}
                        onKeyDown={(e) => {
                          // Alt+WASD navigation for mrp field
                          if (e.altKey) {
                            const step = isProductEditable ? 3 : 2;
                            if (e.key.toLowerCase() === "w") {
                              e.preventDefault();
                              if (index > 0) {
                                const prevBase = 2 + (index - 1) * step;
                                const target = isProductEditable
                                  ? prevBase + 2
                                  : prevBase + 1;
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
                                const target = isProductEditable
                                  ? nextBase + 2
                                  : nextBase + 1;
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
                              if (left) {
                                left.focus();
                              }
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
                            if (i.isNew) {
                              // Delete the new incomplete row
                              setItems((prevItems) =>
                                prevItems.filter((item) => item._id !== i._id)
                              );
                              showToast("New item discarded", "success");
                            }
                            setEditingItemId(null);
                            setFocusedField(null);
                            return;
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row
                              e.preventDefault();

                              // Add new empty row
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${Date.now()}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                                isNew: true,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's quantity input after a short delay
                              setTimeout(() => {
                                const step = isProductEditable ? 3 : 2;
                                const newRowQuantityInput =
                                  document.querySelector(
                                    `input[tabindex="${
                                      2 + items.length * step
                                    }"]`
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
                              // For new items, only save if complete
                              if (
                                i.isNew &&
                                (!i.product ||
                                  i.product.trim() === "" ||
                                  !i.quantity ||
                                  i.quantity <= 0 ||
                                  !i.mrp ||
                                  i.mrp <= 0)
                              ) {
                                showToast(
                                  "Please complete all fields before saving",
                                  "error"
                                );
                                return;
                              }

                              // Only save if there are actual changes for existing items
                              if (i.isNew || hasItemChanged(i._id)) {
                                saveItemById(i._id).then((result) => {
                                  if (result.success) {
                                    if (i.isNew) {
                                      showToast(
                                        "New item added successfully!",
                                        "success"
                                      );
                                    } else {
                                      showToast("Value updated", "success");
                                    }

                                    if (index === items.length - 1) {
                                      // Last row: Move to Add Item button
                                      if (onLastCellTab) {
                                        onLastCellTab();
                                      }
                                    } else {
                                      // Not last row: Move to next row's first input field
                                      const nextRowFirstInput =
                                        document.querySelector(
                                          `input[tabindex="${
                                            2 +
                                            (index + 1) *
                                              (isProductEditable ? 3 : 2)
                                          }"]`
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
                                  }
                                });
                              } else {
                                // No changes, just move to next field
                                if (index === items.length - 1) {
                                  // Last row: Move to Add Item button
                                  if (onLastCellTab) {
                                    onLastCellTab();
                                  }
                                } else {
                                  // Not last row: Move to next row's first input field
                                  const nextRowFirstInput =
                                    document.querySelector(
                                      `input[tabindex="${
                                        2 +
                                        (index + 1) *
                                          (isProductEditable ? 3 : 2)
                                      }"]`
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
                              }
                            }
                          }

                          // Tab key: Only work for new items, go back to searchbar
                          if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            e.stopPropagation();

                            console.log(
                              "Tab pressed in MRP field, item isNew:",
                              i.isNew
                            );

                            // Only allow Tab traversal for new items
                            if (i.isNew) {
                              console.log(
                                "Calling onLastCellTab to go back to search bar"
                              );
                              // For new items, always go back to searchbar after MRP
                              if (onLastCellTab) {
                                onLastCellTab();
                              }
                            }
                            return;
                          }

                          // Delete key: Quick delete current row and move to Add Item
                          if (e.key === "Delete") {
                            e.preventDefault();
                            console.log(
                              "Delete pressed - quick deleting row:",
                              i._id
                            );
                            // Delete the current row
                            setItems((prevItems) =>
                              prevItems.filter((item) => item._id !== i._id)
                            );
                            // Show success message
                            showToast("Item deleted successfully!", "success");
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
                        {i.isNew || (!i.isNew && hasItemChanged(i._id)) ? (
                          <AiOutlineCheck
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(
                                "Save button clicked for item:",
                                i._id
                              );
                              const result = await saveItemById(i._id);
                              if (result.success) {
                                if (i.isNew) {
                                  showToast(
                                    "New item added successfully!",
                                    "success"
                                  );
                                } else {
                                  showToast("Value updated", "success");
                                }
                                setEditingItemId(null);
                              }
                            }}
                            className={`absolute right-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] ${
                              focusedField === "mrp"
                                ? "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"
                                : "text-gray-400"
                            }`}
                            tabIndex={-1}
                            role="button"
                            aria-label={`Save changes for item ${i.product}`}
                          />
                        ) : !i.isNew ? (
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
                            tabIndex={-1}
                            role="button"
                            aria-label={`Delete item ${i.product}`}
                          />
                        ) : null}
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

export default BillTable;

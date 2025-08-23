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
}) => {
  const highlightedRowRef = useRef(null);
  const lastInputRef = useRef(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // State to track which field is focused for new rows
  const [focusedField, setFocusedField] = useState(null);
  const [focusedRowId, setFocusedRowId] = useState(null);

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
      if (!item) return Promise.resolve({ success: false });

      // Check if the item is empty (no product name)
      if (!item.product || item.product.trim() === "") {
        // Remove empty row from local state
        setItems((prev) => prev.filter((it) => it._id !== itemId));
        return Promise.resolve({ success: false });
      }

      // Check if quantity and MRP are valid numbers
      const quantity = Number(item.quantity || 0);
      const mrp = Number(item.mrp || 0);

      if (isNaN(quantity) || isNaN(mrp)) {
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

      if (item.isNew) {
        // Only create if we have valid data
        if (quantity > 0 && mrp > 0) {
          try {
            const response = await axios.post(`${API_URL}/createItem`, payload);
            // Update local state with the real item from backend, preserving the current values
            setItems((prev) =>
              prev.map((it) =>
                it._id === itemId
                  ? {
                      ...it,
                      ...response.data,
                      isNew: false,
                      // Ensure the display values are preserved
                      product: it.product,
                      quantity: it.quantity,
                      mrp: it.mrp,
                      netamt: it.netamt,
                    }
                  : it
              )
            );
            return Promise.resolve({ success: true });
          } catch (err) {
            console.log("Failed to create item:", err);
            // Don't remove the row on creation failure, let user retry
            return Promise.resolve({ success: false });
          }
        }
        // If quantity or MRP is 0, keep the item in local state but don't save to backend
        return Promise.resolve({ success: false });
      } else {
        // Update existing item
        try {
          await axios.put(`${API_URL}/updateItem/${itemId}`, {
            ...payload,
            _id: itemId,
          });
          // Normalize numbers in local state after save, preserving display values
          setItems((prev) =>
            prev.map((it) =>
              it._id === itemId
                ? {
                    ...it,
                    ...payload,
                    // Ensure the display values are preserved
                    product: it.product,
                    quantity: it.quantity,
                    mrp: it.mrp,
                    netamt: it.netamt,
                  }
                : it
            )
          );
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
                // Each row has 3 focusable elements: product, quantity, mrp (delete only for saved items)
                const baseTabIndex = 2 + index * 3;
                const productTabIndex = baseTabIndex;
                const quantityTabIndex = baseTabIndex + 1;
                const mrpTabIndex = baseTabIndex + 2;

                return (
                  <tr
                    key={i.itemCode || i._id}
                    ref={isHighlighted ? highlightedRowRef : null}
                    data-item-id={i._id}
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
                        className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                          i.isNew &&
                          focusedField === "product" &&
                          focusedRowId === i._id
                            ? "bg-blue-50/20"
                            : ""
                        }`}
                        type="text"
                        value={i.product || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateLocalItemField(i._id, "product", value);
                        }}
                        onFocus={() => {
                          // Track which field is focused for new rows
                          if (i.isNew) {
                            setFocusedField("product");
                            setFocusedRowId(i._id);
                          }
                        }}
                        onBlur={() => {
                          // Reset focused field
                          if (i.isNew && focusedRowId === i._id) {
                            setFocusedField(null);
                            setFocusedRowId(null);
                          }
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          // ESC key: Delete new row if it's incomplete
                          if (e.key === "Escape" && i.isNew) {
                            e.preventDefault();
                            // Check if the row is empty or incomplete
                            if (
                              !i.product ||
                              i.product.trim() === "" ||
                              !i.quantity ||
                              i.quantity <= 0 ||
                              !i.mrp ||
                              i.mrp <= 0
                            ) {
                              setItems((prevItems) =>
                                prevItems.filter((item) => item._id !== i._id)
                              );
                              showToast("New row cancelled", "success");
                              return;
                            }
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row only if current row is complete
                              e.preventDefault();

                              // Check if there's already an incomplete new row
                              const incompleteNewRow = items.find(
                                (item) =>
                                  item.isNew &&
                                  (!item.product ||
                                    item.product.trim() === "" ||
                                    !item.quantity ||
                                    item.quantity <= 0 ||
                                    !item.mrp ||
                                    item.mrp <= 0)
                              );

                              if (incompleteNewRow) {
                                // Show warning toast
                                showToast(
                                  "Please complete the current row first!",
                                  "error"
                                );
                                return;
                              }

                              // Create a new empty item
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${items.length + 1}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                                isNew: true,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's product input after a short delay
                              setTimeout(() => {
                                const newRowProductInput =
                                  document.querySelector(
                                    `input[tabindex="${2 + items.length * 3}"]`
                                  );
                                if (newRowProductInput) {
                                  newRowProductInput.focus();
                                  // Scroll to ensure the new row is visible
                                  newRowProductInput.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }
                              }, 100);
                            } else {
                              // Normal Enter: Save and move to quantity field
                              e.preventDefault();
                              const quantityInput = document.querySelector(
                                `input[tabindex="${quantityTabIndex}"]`
                              );
                              if (quantityInput) {
                                quantityInput.focus();
                              }
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
                        className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                          i.isNew &&
                          focusedField === "quantity" &&
                          focusedRowId === i._id
                            ? "bg-blue-50/20"
                            : ""
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
                          if (i.isNew) {
                            setFocusedField("quantity");
                            setFocusedRowId(i._id);
                          }
                        }}
                        onBlur={() => {
                          // Reset focused field
                          if (i.isNew && focusedRowId === i._id) {
                            setFocusedField(null);
                            setFocusedRowId(null);
                          }
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          // ESC key: Delete new row if it's incomplete
                          if (e.key === "Escape" && i.isNew) {
                            e.preventDefault();
                            // Check if the row is empty or incomplete
                            if (
                              !i.product ||
                              i.product.trim() === "" ||
                              !i.quantity ||
                              i.quantity <= 0 ||
                              !i.mrp ||
                              i.mrp <= 0
                            ) {
                              setItems((prevItems) =>
                                prevItems.filter((item) => item._id !== i._id)
                              );
                              showToast("New row cancelled", "success");
                              return;
                            }
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row only if current row is complete
                              e.preventDefault();

                              // Check if there's already an incomplete new row
                              const incompleteNewRow = items.find(
                                (item) =>
                                  item.isNew &&
                                  (!item.product ||
                                    item.product.trim() === "" ||
                                    !item.quantity ||
                                    item.quantity <= 0 ||
                                    !item.mrp ||
                                    item.mrp <= 0)
                              );

                              if (incompleteNewRow) {
                                // Show warning toast
                                showToast(
                                  "Please complete the current row first!",
                                  "error"
                                );
                                return;
                              }

                              // Create a new empty item
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${items.length + 1}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                                isNew: true,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's product input after a short delay
                              setTimeout(() => {
                                const newRowProductInput =
                                  document.querySelector(
                                    `input[tabindex="${2 + items.length * 3}"]`
                                  );
                                if (newRowProductInput) {
                                  newRowProductInput.focus();
                                  // Scroll to ensure the new row is visible
                                  newRowProductInput.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }
                              }, 100);
                            } else {
                              // Normal Enter: Save and move to MRP field
                              e.preventDefault();
                              const mrpInput = document.querySelector(
                                `input[tabindex="${mrpTabIndex}"]`
                              );
                              if (mrpInput) {
                                mrpInput.focus();
                              }
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
                        className={`w-full h-full px-6 py-4 text-center focus:outline-none border border-transparent focus:border-[#3379E9] rounded-none ${
                          i.isNew &&
                          focusedField === "mrp" &&
                          focusedRowId === i._id
                            ? "bg-blue-50/20"
                            : ""
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
                          if (i.isNew) {
                            setFocusedField("mrp");
                            setFocusedRowId(i._id);
                          }
                        }}
                        onBlur={() => {
                          // Reset focused field
                          if (i.isNew && focusedRowId === i._id) {
                            setFocusedField(null);
                            setFocusedRowId(null);
                          }
                          // Only save if we have a product name
                          if (i.product && i.product.trim() !== "") {
                            saveItemById(i._id);
                          }
                        }}
                        onKeyDown={(e) => {
                          // ESC key: Delete new row if it's incomplete
                          if (e.key === "Escape" && i.isNew) {
                            e.preventDefault();
                            // Check if the row is empty or incomplete
                            if (
                              !i.product ||
                              i.product.trim() === "" ||
                              !i.quantity ||
                              i.quantity <= 0 ||
                              !i.mrp ||
                              i.mrp <= 0
                            ) {
                              setItems((prevItems) =>
                                prevItems.filter((item) => item._id !== i._id)
                              );
                              showToast("New row cancelled", "success");
                              return;
                            }
                          }

                          if (e.key === "Enter") {
                            if (e.shiftKey) {
                              // Shift + Enter: Create new row only if current row is complete
                              e.preventDefault();

                              // Check if there's already an incomplete new row
                              const incompleteNewRow = items.find(
                                (item) =>
                                  item.isNew &&
                                  (!item.product ||
                                    item.product.trim() === "" ||
                                    !item.quantity ||
                                    item.quantity <= 0 ||
                                    !item.mrp ||
                                    item.mrp <= 0)
                              );

                              if (incompleteNewRow) {
                                // Show warning toast
                                showToast(
                                  "Please complete the current row first!",
                                  "error"
                                );
                                return;
                              }

                              // Create a new empty item
                              const newItem = {
                                _id: `temp_${Date.now()}`,
                                itemCode: `ITEM${items.length + 1}`,
                                product: "",
                                quantity: "",
                                mrp: "",
                                netamt: 0,
                                isNew: true,
                              };
                              setItems((prevItems) => [...prevItems, newItem]);

                              // Focus on the new row's product input after a short delay
                              setTimeout(() => {
                                const newRowProductInput =
                                  document.querySelector(
                                    `input[tabindex="${2 + items.length * 3}"]`
                                  );
                                if (newRowProductInput) {
                                  newRowProductInput.focus();
                                  // Scroll to ensure the new row is visible
                                  newRowProductInput.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                                }
                              }, 100);
                            } else {
                              // Normal Enter: Save and show success message if item is new
                              e.preventDefault();
                              if (
                                i.isNew &&
                                i.product &&
                                i.product.trim() !== "" &&
                                i.quantity > 0 &&
                                i.mrp > 0
                              ) {
                                // This is a new item with valid data, save it and show success
                                saveItemById(i._id).then((result) => {
                                  if (result.success) {
                                    showToast(
                                      "Item added successfully!",
                                      "success"
                                    );
                                  }
                                  if (index === items.length - 1) {
                                    // Last row: Move to Add Item button
                                    if (onLastCellTab) {
                                      onLastCellTab();
                                    }
                                  } else {
                                    // Not last row: Move to next row's product input
                                    const nextRowProductInput =
                                      document.querySelector(
                                        `input[tabindex="${
                                          2 + (index + 1) * 3
                                        }"]`
                                      );
                                    if (nextRowProductInput) {
                                      nextRowProductInput.focus();
                                      // Scroll to ensure the next row is visible
                                      nextRowProductInput.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                    }
                                  }
                                });
                              } else {
                                // Not a new item or invalid data, just blur
                                e.currentTarget.blur();
                              }
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

                    {/* Net amount + action cell - light grey, centered */}
                    <td className={`p-0 text-center relative`}>
                      <div className="w-full h-full px-6 py-4 flex items-center justify-center">
                        <span>{i.netamt}</span>
                        {i.isNew ? (
                          <AiOutlineCheck
                            className={`${iconClassName} absolute right-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] ${
                              focusedField === "mrp" && focusedRowId === i._id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                            tabIndex={-1}
                            role="button"
                            aria-label={`New item ${i.product}`}
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
                            className={`${iconClassName} absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 rounded-sm hover:scale-110 focus:scale-110 focus:drop-shadow-[0_0_10px_rgba(51,121,233,0.6)] focus:opacity-100`}
                            tabIndex={baseTabIndex + 3}
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
                                      `input[tabindex="${2 + (index + 1) * 3}"]`
                                    );
                                  if (nextRowProductInput) {
                                    nextRowProductInput.focus();
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

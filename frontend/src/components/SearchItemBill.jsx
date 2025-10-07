import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

const SearchItemBill = ({
  onItemSelect,
  onCtrlEnterPrint,
  onTabToTable, // Callback when Tab is pressed to move to table
  name,
  className,
  iconClassName,
  iconWrapperClassName,
  placeholderClassName,
}) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(true);
  const [selectedItem, setSelectedItem] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // New item creation states
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newItemStep, setNewItemStep] = useState(0); // 0: name, 1: quantity, 2: mrp
  const [newItemData, setNewItemData] = useState({
    product: "",
    quantity: "",
    mrp: "",
  });
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const isDarkMode = useMemo(() => {
    try {
      return (localStorage.getItem("theme") || "dark") === "dark";
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    console.log("Updated input value:", input);
  }, [input]);

  useEffect(() => {
    // Highlight first item when results are present
    if (results.length > 0) setSelectedItem(0);
    else setSelectedItem(-1);
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItem >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedItem];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedItem]);

  const API_URL = import.meta.env.VITE_API_URL;
  const BACKEND_BASE_URL =
    import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5001";

  // Function to create new item in database
  const createNewItem = async (itemData) => {
    try {
      const payload = {
        itemCode: `ITEM${Date.now().toString().slice(-6)}`,
        product: itemData.product,
        quantity: Number(itemData.quantity) || 1,
        mrp: parseFloat(itemData.mrp) || 0,
        netamt:
          Math.trunc(
            (Number(itemData.quantity) || 1) *
              (parseFloat(itemData.mrp) || 0) *
              10
          ) / 10,
      };

      console.log("🌐 Sending to backend:", payload);

      const response = await fetch(`${BACKEND_BASE_URL}/createItem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ Response error:", errorText);
        throw new Error(
          `Failed to create item: ${response.status} ${errorText}`
        );
      }

      const newItem = await response.json();
      console.log("✅ Backend returned:", newItem);
      return newItem;
    } catch (error) {
      console.error("❌ Error creating new item:", error);
      throw error;
    }
  };

  const fetchData = async (value) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    // Only search if the input doesn't have the format "product - quantity - price"
    if (!value.includes(" - ")) {
      setIsLoading(true);
      try {
        if (abortRef.current) {
          try {
            abortRef.current.abort();
          } catch {}
        }
        const controller = new AbortController();
        abortRef.current = controller;
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        const data = await response.json();
        const filteredResults = data.filter((item) => {
          return (
            item &&
            item.product &&
            item.product.toLowerCase().includes(value.toLowerCase())
          );
        });
        setResults(filteredResults);
        setShowResults(true);
      } catch (error) {
        if (error?.name === "AbortError") {
          // ignore aborted requests
        } else {
          console.error("Error fetching items:", error);
          toast.error("Failed to fetch items. Please try again.");
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleChange = (value) => {
    if (isCreatingNew) {
      // Just update the input during new item creation
      // We'll save the data when Tab/Enter is pressed
      setInput(value);
    } else {
      setInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }
      debounceRef.current = setTimeout(() => {
        fetchData(value);
      }, 200);
    }
  };

  const startNewItemCreation = () => {
    console.log("🚀 STARTING NEW ITEM CREATION");
    console.log("🔍 Initial search term:", input);

    // Automatically save the product name and move to quantity step
    const productName = input.trim();
    setIsCreatingNew(true);
    setNewItemStep(1); // Start at quantity step, not product name step
    setNewItemData({ product: productName, quantity: "1", mrp: "100" });
    setInput("1"); // Show default quantity
    setShowResults(false);

    console.log("📝 Product name auto-saved:", productName);
    console.log("📦 Moving to quantity step with default value: 1");
  };

  const handleNewItemTab = () => {
    console.log("🔄 HANDLE TAB/ENTER - Step:", newItemStep, "Input:", input);

    if (newItemStep === 1) {
      // Save quantity and move to MRP
      const quantity = input.trim() || "1";
      console.log("📦 STEP 1: Saving quantity:", quantity);
      const updatedData = { ...newItemData, quantity: quantity };
      setNewItemData(updatedData);
      setNewItemStep(2);
      setInput(updatedData.mrp || "100"); // Use saved MRP or default
      console.log("✅ STEP 1 COMPLETE - Updated data:", updatedData);
      console.log(
        "💰 Moving to MRP step with default/saved value:",
        updatedData.mrp || "100"
      );
    } else if (newItemStep === 2) {
      // Save MRP and finish creating item
      const mrp = input.trim() || "100";
      console.log("💰 STEP 2: Saving MRP:", mrp);
      const finalData = { ...newItemData, mrp: mrp };
      console.log("✅ STEP 2 COMPLETE - Final data:", finalData);

      // Pass the final data directly to avoid state timing issues
      finishNewItemCreation(finalData);
    }
  };

  const finishNewItemCreation = async (finalData) => {
    try {
      console.log("🏁 FINISHING ITEM CREATION");
      console.log("📊 Final data received:", finalData);

      // Validate data
      if (!finalData.product || !finalData.product.trim()) {
        console.log("❌ ERROR: Product name is missing");
        toast.error("Product name is required");
        return;
      }

      const billQuantity = parseInt(finalData.quantity) || 1;
      const mrp = parseFloat(finalData.mrp) || 0;

      console.log(
        "🔢 Using values - Product:",
        finalData.product,
        "Bill Quantity:",
        billQuantity,
        "MRP:",
        mrp
      );

      if (mrp <= 0) {
        console.log("❌ ERROR: Invalid MRP");
        toast.error("MRP must be greater than 0");
        return;
      }

      const itemToCreate = {
        product: finalData.product.trim(),
        quantity: billQuantity, // persist entered qty to inventory
        mrp: mrp,
      };

      console.log("🚀 Creating item in database:", itemToCreate);

      // Create item in database ONLY ONCE
      const createdItem = await createNewItem(itemToCreate);
      console.log("✅ Item created in database:", createdItem);

      // Add item to bill with the user-specified quantity
      const billItem = {
        _id: createdItem._id,
        itemCode: createdItem.itemCode,
        product: createdItem.product, // Use product from database response
        quantity: billQuantity, // Use the quantity the user entered for the bill
        mrp: mrp,
        netamt: Math.trunc(billQuantity * mrp * 10) / 10, // Calculate with 1-decimal truncation
        isNew: false, // Set to false since it's now saved in database
      };

      console.log("📋 Adding item to bill:", billItem);
      onItemSelect(billItem);

      // Reset states
      setIsCreatingNew(false);
      setNewItemStep(1); // Reset to step 1 for next time
      setNewItemData({ product: "", quantity: "1", mrp: "100" });
      setInput("");
      setShowResults(false);

      console.log("🎉 Item creation completed successfully!");
      toast.success(
        `New item "${finalData.product}" created and added to bill!`
      );

      // Trigger a custom event to notify other components (like inventory) to refresh
      window.dispatchEvent(
        new CustomEvent("newItemCreated", {
          detail: { item: createdItem, product: finalData.product },
        })
      );
    } catch (error) {
      console.error("❌ Error creating new item:", error);
      toast.error("Failed to create new item");
    }
  };

  const cancelNewItemCreation = () => {
    setIsCreatingNew(false);
    setNewItemStep(0);
    setNewItemData({ product: "", quantity: "", mrp: "" });
    setInput("");
    setShowResults(false);
  };

  const handleResultClick = (result) => {
    try {
      console.log(
        "SearchItemBill - handleResultClick called with result:",
        result
      );

      // Create item object
      const item = {
        product: result.product,
        // Always start with quantity 1 on Bill page when selected from search
        quantity: 1,
        // MRP should match inventory's MRP
        mrp: result.mrp || 0,
        itemCode:
          result.itemCode || "MANUAL-" + Date.now().toString().slice(-6),
        netamt: Math.trunc(1 * (result.mrp || 0) * 10) / 10,
      };

      console.log("SearchItemBill - Created item:", item);
      console.log("SearchItemBill - Calling onItemSelect with item:", item);

      // Add item to table
      onItemSelect(item);

      // Clear input after adding
      setInput("");
      setShowResults(false);
      toast.success("Item added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    // Ignore Ctrl+Enter so it doesn't add items when using the print shortcut
    if (e.ctrlKey && (e.key === "Enter" || e.code === "Enter")) {
      e.preventDefault();
      onCtrlEnterPrint?.();
      return;
    }

    // Handle new item creation flow
    if (isCreatingNew) {
      if (e.key === "Tab") {
        e.preventDefault();
        handleNewItemTab();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (newItemStep === 2) {
          // On Enter at MRP step, save MRP and finish creation
          const mrp = input.trim() || "100";
          console.log("💰 ENTER on STEP 2: Saving MRP:", mrp);
          const finalData = { ...newItemData, mrp: mrp };
          finishNewItemCreation(finalData);
        } else {
          // On Enter at other steps, move to next step
          handleNewItemTab();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelNewItemCreation();
      }
      return;
    }

    if (e.key === "Enter") {
      // Check if input has the format "product - quantity - price"
      if (input.includes(" - ")) {
        const parts = input.split(" - ");
        if (parts.length === 3) {
          try {
            const product = parts[0];
            const quantity = parseInt(parts[1], 10) || 1;
            const mrp = parseFloat(parts[2]) || 0;

            // Create item object
            const item = {
              product: product,
              quantity: quantity,
              mrp: mrp,
              itemCode: "MANUAL-" + Date.now().toString().slice(-6),
              netamt: Math.trunc(quantity * mrp * 10) / 10,
            };

            console.log("SearchItemBill - Enter key - Created item:", item);
            console.log(
              "SearchItemBill - Enter key - Calling onItemSelect with item:",
              item
            );

            // Add item to table
            onItemSelect(item);

            // Clear input after adding
            setInput("");
            setShowResults(false);
            toast.success("Item added successfully!");
          } catch (error) {
            console.error("Error adding manual item:", error);
            toast.error("Failed to add item. Please check the format.");
          }
        }
      } else if (results.length > 0) {
        const indexToUse = selectedItem >= 0 ? selectedItem : 0;
        const selectedResult = results[indexToUse];
        if (selectedResult) handleResultClick(selectedResult);
      } else if (input.trim() && !isLoading) {
        // No results found, offer to create new item
        startNewItemCreation();
      }
    } else if (e.key === "Tab") {
      if (e.shiftKey) {
        // Shift+Tab: Navigate backward through search results if available
        if (results.length > 0) {
          e.preventDefault();
          setSelectedItem((prev) =>
            prev <= 0 ? results.length - 1 : prev - 1
          );
        }
        // If no results, let default Shift+Tab behavior work
      } else {
        // Normal Tab: Move to table or handle new item creation
        e.preventDefault();
        if (results.length === 0 && input.trim() && !isLoading) {
          // No results found, start new item creation
          startNewItemCreation();
        } else if (onTabToTable) {
          onTabToTable();
        }
      }
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setSelectedItem((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setSelectedItem((prev) => (prev >= results.length - 1 ? 0 : prev + 1));
    } else if (e.key === "Escape") {
      if (isCreatingNew) {
        cancelNewItemCreation();
      } else {
        setShowResults(false);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className={className}>
        <div className={iconWrapperClassName}>
          <FaSearch className={iconClassName} />
        </div>
        <input
          type="text"
          placeholder={
            isCreatingNew
              ? newItemStep === 1
                ? "Enter quantity (default: 1)"
                : newItemStep === 2
                ? "Enter MRP (default: 100)"
                : "Product name saved"
              : name
          }
          id="global-search-input"
          tabIndex={1}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode={
            newItemStep === 1 || newItemStep === 2 ? "numeric" : "search"
          }
          className={`outline-none bg-transparent w-full placeholder:${placeholderClassName}`}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (
              input.trim() &&
              results.length > 0 &&
              !input.includes(" - ") &&
              !isCreatingNew
            ) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click to register
            if (!isCreatingNew) {
              setTimeout(() => setShowResults(false), 150);
            }
          }}
        />
      </div>

      {/* Search Results */}
      {showResults &&
        input.trim() !== "" &&
        !input.includes(" - ") &&
        !isCreatingNew && (
          <div
            ref={resultsRef}
            className={`absolute top-[60px] w-full rounded-[24px] flex flex-col shadow-lg max-h-[240px] overflow-y-auto z-50 scrollbar-hide border ${
              isDarkMode
                ? "bg-[#2a2a2d] border-white/10"
                : "bg-white border-[#f4f4f6]"
            }`}
          >
            {isLoading ? (
              <div
                className={`p-3 text-center ${
                  isDarkMode ? "text-[#9aa0ae]" : "text-[#767c8f]"
                }`}
              >
                Loading...
              </div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <div
                  key={result._id || result.itemCode}
                  onClick={() => handleResultClick(result)}
                  role="button"
                  tabIndex={0}
                  className={
                    selectedItem === index
                      ? isDarkMode
                        ? "p-3 bg-[#343438] text-white font-medium text-[13px] cursor-pointer focus:outline-none"
                        : "p-3 bg-[#f4f4f6] text-[#141416] font-medium text-[13px] cursor-pointer focus:outline-none"
                      : isDarkMode
                      ? "p-3 hover:bg-[#343438] text-white font-medium text-[13px] cursor-pointer focus:outline-none transition-colors duration-150"
                      : "p-3 hover:bg-[#f4f4f6] text-[#141416] font-medium text-[13px] cursor-pointer focus:outline-none transition-colors duration-150"
                  }
                >
                  {result?.product || "No Item Code"}
                </div>
              ))
            ) : (
              <div
                onClick={startNewItemCreation}
                role="button"
                tabIndex={0}
                className={`p-3 cursor-pointer border-l-4 border-[#3379E9] ${
                  isDarkMode
                    ? "text-[#3379E9] hover:bg-[#343438] font-medium text-[13px] focus:outline-none transition-colors duration-150"
                    : "text-[#3379E9] hover:bg-[#f4f4f6] font-medium text-[13px] focus:outline-none transition-colors duration-150"
                }`}
              >
                + Add New Item: "{input}"
              </div>
            )}
          </div>
        )}

      {/* New Item Creation Indicator */}
      {isCreatingNew && (
        <div
          className={`absolute top-[60px] w-full rounded-[24px] p-4 shadow-lg z-50 border ${
            isDarkMode
              ? "bg-[#2a2a2d] border-[#3379E9]/30"
              : "bg-white border-[#3379E9]/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#3379E9] rounded-full"></div>
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-[#3379E9]" : "text-[#3379E9]"
              }`}
            >
              Creating New Item
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs mb-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded">
              Name: {newItemData.product}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                newItemStep === 1
                  ? "bg-[#3379E9] text-white"
                  : newItemData.quantity && newItemStep > 1
                  ? "bg-green-500 text-white"
                  : isDarkMode
                  ? "bg-[#343438] text-[#767c8f]"
                  : "bg-[#f4f4f6] text-[#767c8f]"
              }`}
            >
              Qty
              {newItemData.quantity && newItemStep > 1
                ? `: ${newItemData.quantity}`
                : ""}
            </span>
            <span
              className={`px-2 py-1 rounded ${
                newItemStep === 2
                  ? "bg-[#3379E9] text-white"
                  : newItemData.mrp && newItemStep > 2
                  ? "bg-green-500 text-white"
                  : isDarkMode
                  ? "bg-[#343438] text-[#767c8f]"
                  : "bg-[#f4f4f6] text-[#767c8f]"
              }`}
            >
              MRP
              {newItemData.mrp && newItemStep > 2
                ? `: ₹${newItemData.mrp}`
                : ""}
            </span>
          </div>
          <div
            className={`text-xs ${
              isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
            }`}
          >
            Press Tab to continue, Enter to finish, Esc to cancel
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchItemBill;

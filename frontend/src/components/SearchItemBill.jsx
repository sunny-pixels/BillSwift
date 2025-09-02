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
  };

  const handleResultClick = (result) => {
    try {
      // Create item object
      const item = {
        product: result.product,
        // Always start with quantity 1 on Bill page when selected from search
        quantity: 1,
        // MRP should match inventory's MRP
        mrp: result.mrp || 0,
        itemCode:
          result.itemCode || "MANUAL-" + Date.now().toString().slice(-6),
        netamt: 1 * (result.mrp || 0),
      };

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
              netamt: quantity * mrp,
            };

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
        // Normal Tab: Move to table
        e.preventDefault();
        if (onTabToTable) {
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
      setShowResults(false);
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
          placeholder={name}
          id="global-search-input"
          tabIndex={1}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="search"
          className={`outline-none bg-transparent w-full placeholder:${placeholderClassName}`}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (input.trim() && results.length > 0 && !input.includes(" - ")) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click to register
            setTimeout(() => setShowResults(false), 150);
          }}
        />
      </div>

      {/* Search Results */}
      {showResults && input.trim() !== "" && !input.includes(" - ") && (
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
              className={`p-3 text-center ${
                isDarkMode ? "text-[#9aa0ae]" : "text-[#767c8f]"
              }`}
            >
              No items found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchItemBill;

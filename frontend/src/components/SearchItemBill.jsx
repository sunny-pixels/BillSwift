import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

const SearchItemBill = ({ onItemSelect, name, className, iconClassName, iconWrapperClassName, placeholderClassName }) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(true);
  const [selectedItem, setSelectedItem] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    console.log("Updated input value:", input);
  }, [input]);

  useEffect(() => {
    // Reset selected item when results change
    setSelectedItem(-1);
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

  const fetchData = async (value) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    // Only search if the input doesn't have the format "product - quantity - price"
    if (!value.includes(" - ")) {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5001/");
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        const filteredResults = data.filter((item) => {
          return item && item.product && item.product.toLowerCase().includes(value.toLowerCase());
        });
        setResults(filteredResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error fetching items:', error);
        toast.error('Failed to fetch items. Please try again.');
        setResults([]);
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
    fetchData(value);
  };

  const handleResultClick = (result) => {
    try {
      // Create item object
      const item = {
        product: result.product,
        quantity: result.quantity || 1,
        mrp: result.mrp || 0,
        itemCode: result.itemCode || "MANUAL-" + Date.now().toString().slice(-6),
        netamt: (result.quantity || 1) * (result.mrp || 0)
      };
      
      // Add item to table
      onItemSelect(item);
      
      // Clear input after adding
      setInput("");
      setShowResults(false);
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item. Please try again.');
    }
  };

  const handleKeyDown = (e) => {
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
              netamt: quantity * mrp
            };
            
            // Add item to table
            onItemSelect(item);
            
            // Clear input after adding
            setInput("");
            setShowResults(false);
            toast.success('Item added successfully!');
          } catch (error) {
            console.error('Error adding manual item:', error);
            toast.error('Failed to add item. Please check the format.');
          }
        }
      } else if (results.length > 0 && selectedItem >= 0) {
        const selectedResult = results[selectedItem];
        if (selectedResult) {
          handleResultClick(selectedResult);
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
          className={`outline-none bg-transparent w-full placeholder:${placeholderClassName}`}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (input.trim() && results.length > 0 && !input.includes(" - ")) {
              setShowResults(true);
            }
          }}
        />
      </div>

      {/* Search Results */}
      {showResults && input.trim() !== "" && !input.includes(" - ") && (
        <div 
          ref={resultsRef}
          className="absolute top-[60px] w-full bg-white rounded-[24px] flex flex-col shadow-md max-h-[200px] overflow-y-auto z-15 scrollbar-hide border border-[#f4f4f6]"
        >
          {isLoading ? (
            <div className="p-3 text-[#767c8f] text-center">Loading...</div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={result._id || result.itemCode}
                onClick={() => handleResultClick(result)}
                role="button"
                tabIndex={0}
                className={
                  selectedItem === index 
                    ? "p-3 bg-[#f4f4f6] text-[#141416] font-medium text-[13px] cursor-pointer focus:outline-none" 
                    : "p-3 hover:bg-[#f4f4f6] text-[#141416] font-medium text-[13px] cursor-pointer focus:outline-none focus:bg-[#f4f4f6] transition-colors duration-150"
                }
              >
                {result?.product || "No Item Code"}
              </div>
            ))
          ) : (
            <div className="p-3 text-[#767c8f] text-center">No items found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchItemBill;
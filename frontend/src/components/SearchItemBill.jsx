import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";

const SearchItemBill = ({ onItemSelect, name, className }) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(true);
  const [selectedItem, setSelectedItem] = useState(-1);
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

  const fetchData = (value) => {
    if (!value.trim()) {
      setResults([]);
      return;
    }

    // Only search if the input doesn't have the format "product - quantity - price"
    if (!value.includes(" - ")) {
      fetch("http://localhost:5001/")
        .then((res) => res.json())
        .then((data) => {
          const filteredResults = data.filter((item) => {
            return item && item.product && item.product.toLowerCase().includes(value.toLowerCase());
          });
          setResults(filteredResults);
          setShowResults(true);
        });
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
    // Set the formatted input
    const formattedInput = `${result.product} - ${result.quantity || 1} - ${result.mrp || 0}`;
    setInput(formattedInput);
    setShowResults(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Check if input has the format "product - quantity - price"
      if (input.includes(" - ")) {
        const parts = input.split(" - ");
        if (parts.length === 3) {
          const product = parts[0];
          const quantity = parseInt(parts[1], 10) || 1;
          const mrp = parseFloat(parts[2]) || 0;
          
          // Create item object
          const item = {
            product: product,
            quantity: quantity,
            mrp: mrp,
            itemCode: "MANUAL-" + Date.now().toString().slice(-6)
          };
          
          // Add item to table
          onItemSelect(item);
          
          // Clear input after adding
          setInput("");
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
    <div className="relative w-full flex justify-center">
      <div className={`flex items-center border border-[#9ACBD0] rounded-lg px-3 py-2 bg-white w-[90%] mt-4 focus-within:ring-2 focus-within:ring-[#48A6A7] transition duration-200 ${className}`}>
        <FaSearch className="text-[#48A6A7] mr-2 text-[15px]" />
        <input
          type="text"
          placeholder={name}
          className="outline-none bg-transparent w-full text-[15px] text-gray-800 placeholder-gray-400"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (input.trim() && results.length > 0 && !input.includes(" - ")) {
              setShowResults(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && input.trim() !== "" && !input.includes(" - ") && (
        <div 
          ref={resultsRef}
          className="absolute top-[60px] w-full bg-white border border-[#9ACBD0] rounded-lg flex flex-col shadow-md max-h-[200px] overflow-y-auto z-15 scrollbar-hide"
        >
          {results.map((result, index) => (
            <div
              key={result._id || result.itemCode}
              onClick={() => handleResultClick(result)}
              role="button"
              tabIndex={0}
              className={
                selectedItem === index 
                  ? "p-3 bg-[#F2EFE7] text-[#006A71] font-medium text-[13px] cursor-pointer focus:outline-none" 
                  : "p-3 hover:bg-[#F2EFE7] text-gray-700 font-medium text-[13px] cursor-pointer focus:outline-none focus:bg-[#F2EFE7] transition-colors duration-150"
              }
            >
              {result?.product || "No Item Code"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchItemBill;
import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";

const SearchItemInventory = ({ 
  onItemHighlight, 
  name, 
  className, 
  iconClassName, 
  iconWrapperClassName,
  placeholderClassName 
}) => {
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

  // fetch the data and filtered the result that is to be shown in the searchbar
  const fetchData = (value) => {
    // handling the empty values -> makes the result array empty
    if (!value.trim()) {
      setResults([]);
      return;
    }

    // handling the non empty values -> filtered the result as per the input
    if (value.trim()) {
      fetch("http://localhost:5001/")
        .then((res) => res.json())
        .then((data) => {
          const filteredResults = data.filter((item) => {
            return (
              item &&
              item.product &&
              item.product.toLowerCase().includes(value.toLowerCase())
            );
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

  const onItemSelect = (item) => {
    setInput(item.product);
    setShowResults(false);
    console.log("item selected:", item);

    onItemHighlight(item);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && selectedItem >= 0) {
      onItemSelect(results[selectedItem]);
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
        />
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && input.trim() !== "" && (
        <div
          ref={resultsRef}
          className="absolute top-[45px] w-full bg-white rounded-[24px] flex flex-col shadow-md max-h-[200px] overflow-y-auto z-15 scrollbar-hide border border-[#f4f4f6]"
        >
          {results.map((result, index) => (
            <div
              key={result._id || result.itemCode}
              onClick={() => onItemSelect(result)}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchItemInventory;
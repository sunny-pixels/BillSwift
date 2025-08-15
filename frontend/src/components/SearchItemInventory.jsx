import React, { useState, useEffect, useRef, useMemo, forwardRef } from "react";
import { FaSearch } from "react-icons/fa";

const SearchItemInventory = forwardRef(
  (
    {
      onItemHighlight,
      name,
      className,
      iconClassName,
      iconWrapperClassName,
      placeholderClassName,
      tabIndex,
    },
    ref
  ) => {
    const [input, setInput] = useState("");
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(true);
    const [selectedItem, setSelectedItem] = useState(-1);
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

    // fetch the data and filter the results to be shown in the searchbar
    const fetchData = (value) => {
      // handling the empty values -> makes the result array empty
      if (!value.trim()) {
        setResults([]);
        return;
      }

      // handling the non empty values -> filtered the result as per the input
      if (value.trim()) {
        const API_URL = import.meta.env.VITE_API_URL;
        // Abort any in-flight request
        if (abortRef.current) {
          try {
            abortRef.current.abort();
          } catch {}
        }
        const controller = new AbortController();
        abortRef.current = controller;
        fetch(API_URL, { signal: controller.signal })
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
          })
          .catch((err) => {
            if (err?.name === "AbortError") return;
            setResults([]);
          });
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

    const onItemSelect = (item) => {
      setInput(item.product);
      setShowResults(false);
      console.log("item selected:", item);

      onItemHighlight(item);
      setInput("");
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        if (results.length > 0) {
          const indexToUse = selectedItem >= 0 ? selectedItem : 0;
          onItemSelect(results[indexToUse]);
        }
      } else if (e.key === "Tab" && results.length > 0) {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedItem((prev) =>
            prev <= 0 ? results.length - 1 : prev - 1
          );
        } else {
          setSelectedItem((prev) =>
            prev === -1 || prev >= results.length - 1 ? 0 : prev + 1
          );
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
            ref={ref}
            type="text"
            placeholder={name}
            id="global-search-input"
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
            tabIndex={tabIndex}
            onFocus={() => {
              if (results.length > 0) setSelectedItem(0);
              if (input.trim() && results.length > 0) setShowResults(true);
            }}
            onBlur={() => {
              // Delay hiding to allow click selection
              setTimeout(() => setShowResults(false), 150);
            }}
          />
        </div>

        {/* Search Results */}
        {showResults && results.length > 0 && input.trim() !== "" && (
          <div
            ref={resultsRef}
            className={`absolute top-[45px] w-full rounded-[24px] flex flex-col shadow-lg max-h-[240px] overflow-y-auto z-50 scrollbar-hide border ${
              isDarkMode
                ? "bg-[#2a2a2d] border-white/10"
                : "bg-white border-[#f4f4f6]"
            }`}
          >
            {results.map((result, index) => (
              <div
                key={result._id || result.itemCode}
                onClick={() => onItemSelect(result)}
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
            ))}
          </div>
        )}
      </div>
    );
  }
);

SearchItemInventory.displayName = "SearchItemInventory";

export default SearchItemInventory;

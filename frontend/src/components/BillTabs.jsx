import React, { useState } from "react";
import { HiPlus } from "react-icons/hi2";
import { AiOutlineClose } from "react-icons/ai";
import { HiPencil } from "react-icons/hi2";

const BillTabs = ({
  tabs,
  activeTab,
  onTabChange,
  onTabAdd,
  onTabClose,
  onTabRename,
  isDarkMode,
}) => {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleDoubleClick = (tab) => {
    setEditingTabId(tab.id);
    // Remove any trailing counts like " (1)" or a bare number at the end
    setEditValue(tab.name.replace(/(?:\s*\(\d+\)|\s+\d+)$/, ""));
  };

  const handleEditSave = (tabId) => {
    if (editValue.trim()) {
      onTabRename(tabId, editValue.trim());
    }
    setEditingTabId(null);
    setEditValue("");
  };

  const handleEditCancel = () => {
    setEditingTabId(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e, tabId) => {
    if (e.key === "Enter") {
      handleEditSave(tabId);
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  return (
    <div
      className={`tab-container flex items-center gap-0.5 p-1 rounded-t-[24px] ${
        isDarkMode ? "bg-[#2a2a2d]" : "bg-[#f4f4f6]"
      }`}
    >
      {/* Existing tabs */}
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={`tab-item group relative flex items-center gap-2 px-4 py-2.5 rounded-tab-top cursor-pointer transition-all duration-200 min-w-[120px] max-w-[200px] ${
            editingTabId === tab.id
              ? isDarkMode
                ? "bg-[#3379E9]/20 border border-[#3379E9]/30"
                : "bg-[#3379E9]/10 border border-[#3379E9]/20"
              : activeTab === tab.id
              ? isDarkMode
                ? "bg-[#1A1A1C] text-white shadow-lg z-10"
                : "bg-white text-[#141416] shadow-lg z-10"
              : isDarkMode
              ? "text-[#767c8f] hover:bg-[#1A1A1C]/50 hover:text-white bg-[#2a2a2d]"
              : "text-[#767c8f] hover:bg-white/50 hover:text-[#141416] bg-[#f4f4f6]"
          }`}
          onClick={() => onTabChange(tab.id)}
          onDoubleClick={() => handleDoubleClick(tab)}
          title={`${tab.name} - Double-click to edit name`}
        >
          {/* Tab content */}
          <div className="flex items-center gap-2 w-full min-w-0">
            {/* Tab icon/indicator */}
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "bg-[#3379E9]"
                    : "bg-[#3379E9]"
                  : isDarkMode
                  ? "bg-[#767c8f]"
                  : "bg-[#767c8f]"
              }`}
            />

            {/* Tab title - editable on double click */}
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleEditSave(tab.id)}
                onKeyDown={(e) => handleEditKeyDown(e, tab.id)}
                className={`text-sm font-medium bg-transparent border-none outline-none flex-1 min-w-0 px-1 rounded ${
                  isDarkMode
                    ? "text-white bg-white/10 focus:bg-white/20"
                    : "text-[#141416] bg-black/5 focus:bg-black/10"
                } transition-colors duration-200`}
                autoFocus
                maxLength={30}
                placeholder="Enter tab name..."
              />
            ) : (
              <span className="text-sm font-medium truncate flex-1">
                {tab.name}
              </span>
            )}

            {/* Edit indicator */}
            <div
              className={`opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 ${
                editingTabId === tab.id ? "opacity-100" : ""
              }`}
            >
              <HiPencil
                className={`w-3 h-3 ${
                  isDarkMode ? "text-[#767c8f]" : "text-[#767c8f]"
                }`}
              />
            </div>

            {/* Close button */}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-full hover:bg-red-500 hover:text-white flex-shrink-0 ${
                  isDarkMode ? "hover:bg-red-500" : "hover:bg-red-500"
                }`}
                title="Close tab"
              >
                <AiOutlineClose className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add new tab button */}
      <button
        onClick={onTabAdd}
        className={`tab-item p-2 rounded-tab-button transition-all duration-200 ml-1 ${
          isDarkMode
            ? "text-[#767c8f] hover:bg-[#1A1A1C] hover:text-white"
            : "text-[#767c8f] hover:bg-white hover:text-[#141416]"
        }`}
        title="Add new bill (Ctrl+T)"
      >
        <HiPlus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default BillTabs;

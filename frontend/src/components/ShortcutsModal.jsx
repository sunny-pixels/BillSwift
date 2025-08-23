import React, { useEffect, useMemo } from "react";

const ShortcutsModal = ({ isOpen, onClose }) => {
  const isDarkMode = useMemo(() => {
    try {
      return (localStorage.getItem("theme") || "dark") === "dark";
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayClasses =
    "fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4";
  const panelClasses = `w-full max-w-xl max-h-[80vh] border rounded-[24px] shadow-xl ${
    isDarkMode ? "bg-[#1A1A1C] border-white/10" : "bg-white border-black/5"
  }`;
  const headerText = isDarkMode ? "text-white" : "text-[#141416]";
  const subText = isDarkMode ? "text-[#9aa0ae]" : "text-[#767c8f]";

  const Key = ({ children }) => (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-sm font-medium ${
        isDarkMode ? "bg-[#2a2a2d] text-white" : "bg-[#f4f4f6] text-[#141416]"
      }`}
    >
      {children}
    </span>
  );

  const Row = ({ label, keys }) => (
    <div className="flex items-center justify-between py-1">
      <div className={`text-sm ${subText}`}>{label}</div>
      <div className="flex items-center gap-2">
        {keys.map((k, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className={`text-xs ${subText}`}>+</span>}
            <Key>{k}</Key>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className={overlayClasses} onClick={onClose}>
      <div className={panelClasses} onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className={`text-xl font-bold ${headerText}`}>
            Keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`px-3 py-1 rounded-[24px] text-sm font-medium ${
              isDarkMode
                ? "bg-[#2a2a2d] text-white hover:bg-[#343438]"
                : "bg-[#f4f4f6] text-[#141416] hover:bg-[#e8e8ea]"
            }`}
          >
            Esc
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scroll">
          <div className={`text-xs mb-2 ${subText}`}>Navigation</div>
          <div className="space-y-1 mb-4">
            <Row label="Go to Home" keys={["Alt", "1"]} />
            <Row label="Go to Add Item" keys={["Alt", "2"]} />
            <Row label="Go to Billing" keys={["Alt", "3"]} />
          </div>

          <div className={`text-xs mb-2 ${subText}`}>Table Navigation</div>
          <div className="space-y-1 mb-4">
            <Row label="Forward navigation" keys={["Tab"]} />
            <Row label="Reverse navigation" keys={["Shift", "Tab"]} />
          </div>

          <div className={`text-xs mb-2 ${subText}`}>Data Entry</div>
          <div className="space-y-1 mb-4">
            <Row label="Move to next field" keys={["Enter"]} />
            <Row label="Create new item" keys={["Shift", "Enter"]} />
            <Row
              label="Save & move to next row"
              keys={["MRP Field", "Enter"]}
            />
          </div>

          <div className={`text-xs mb-2 ${subText}`}>Quick Actions</div>
          <div className="space-y-1 mb-4">
            <Row label="Delete current row" keys={["Ctrl", "Shift"]} />
          </div>

          <div className={`text-xs mb-2 ${subText}`}>Search</div>
          <div className="space-y-1 mb-4">
            <Row label="Focus search" keys={["Ctrl", "K"]} />
            <Row label="Focus search" keys={["/"]} />
          </div>

          <div className={`text-xs mb-2 ${subText}`}>Shortcuts pane</div>
          <div className="space-y-1">
            <Row label="Open shortcuts" keys={["Ctrl", "~"]} />
            <Row label="Close shortcuts" keys={["Esc"]} />
          </div>
        </div>
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
        `}
      </style>
    </div>
  );
};

export default ShortcutsModal;

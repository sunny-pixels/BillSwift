import React, { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ShortcutsModal from "./components/ShortcutsModal";

import HomePage from "./pages/HomePage";
import BillPage from "./pages/BillPage";
import InventoryPage from "./pages/InventoryPage";

const App = () => {
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  useEffect(() => {
    const handleGlobalHotkeys = (e) => {
      const isInput = ["INPUT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable;

      // Ctrl+K or / => focus global search
      if ((e.ctrlKey && (e.key === "k" || e.key === "K")) || (!isInput && e.key === "/")) {
        e.preventDefault();
        const input = document.getElementById("global-search-input");
        if (input) {
          input.focus();
          input.select?.();
        }
        return;
      }

      // Ctrl+~ (also support Ctrl+` via Backquote) => toggle shortcuts modal
      if (e.ctrlKey && (e.key === "~" || e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Alt+1/2/3 => navigate Home/Inventory/Bill
      if (e.altKey && !isInput) {
        if (e.key === "1") {
          e.preventDefault();
          navigate("/");
        } else if (e.key === "2") {
          e.preventDefault();
          navigate("/inventory");
        } else if (e.key === "3") {
          e.preventDefault();
          navigate("/bill");
        }
      }
    };

    window.addEventListener("keydown", handleGlobalHotkeys);
    return () => window.removeEventListener("keydown", handleGlobalHotkeys);
  }, [navigate]);

  return (
    <div>
      <Toaster position="top-right" />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/bill" element={<BillPage />} /> 
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:id" element={<InventoryPage />} />
      </Routes>
    </div>
  );
};

export default App;

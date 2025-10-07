import React, { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SlideBar from "../components/SlideBar";
import SearchItemBill from "../components/SearchItemBill";
import BillTable from "../components/BillTable";
import Button from "../components/Button";
import PhoneNumberModal from "../components/PhoneNumberModal";
import QRCodeModal from "../components/QRCodeModal";
import BillTabs from "../components/BillTabs";
import {
  checkWhatsAppStatus,
  sendWhatsAppMessage,
} from "../services/whatsappService";
import toast from "react-hot-toast";
import axios from "axios";
import { HiSun, HiMoon } from "react-icons/hi2";

const BillPage = () => {
  // Tabs state management (hydrate from localStorage on first render)
  const [tabs, setTabs] = useState(() => {
    try {
      const savedTabs = localStorage.getItem("billTabs");
      console.log("BillPage - Loading tabs from localStorage:", savedTabs);
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        console.log("BillPage - Parsed tabs from localStorage:", parsed);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.error("BillPage - Error loading tabs from localStorage:", error);
    }
    const defaultTabs = [{ id: "1", name: "Bill 1", items: [] }];
    console.log("BillPage - Using default tabs:", defaultTabs);
    return defaultTabs;
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedActive = localStorage.getItem("activeBillTab");
      console.log(
        "BillPage - Loading activeTab from localStorage:",
        savedActive
      );
      if (savedActive) return savedActive;
    } catch (error) {
      console.error(
        "BillPage - Error loading activeTab from localStorage:",
        error
      );
    }
    console.log("BillPage - Using default activeTab: 1");
    return "1";
  });

  // Get current tab's items
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const items = currentTab ? currentTab.items : [];

  // Safety check: if currentTab is not found, ensure we have a valid tab
  useEffect(() => {
    if (!currentTab && tabs.length > 0) {
      console.log(
        "BillPage - currentTab not found, fixing activeTab to first tab"
      );
      setActiveTab(tabs[0].id);
    }
  }, [currentTab, tabs]);

  // Ensure initial tab is properly set up
  useEffect(() => {
    if (tabs.length === 0) {
      console.log("BillPage - No tabs found, creating initial tab");
      setTabs([{ id: "1", name: "Bill 1", items: [] }]);
      setActiveTab("1");
    }
  }, [tabs.length]);

  // Initial setup effect - runs once on mount
  useEffect(() => {
    console.log("BillPage - Initial setup effect running");
    console.log("BillPage - Initial tabs:", tabs);
    console.log("BillPage - Initial activeTab:", activeTab);

    // Check if localStorage has corrupted data
    try {
      const savedTabs = localStorage.getItem("billTabs");
      const savedActive = localStorage.getItem("activeBillTab");

      if (savedTabs && savedActive) {
        const parsedTabs = JSON.parse(savedTabs);
        const activeTabExists = parsedTabs.find(
          (tab) => tab.id === savedActive
        );

        if (!activeTabExists) {
          console.log(
            "BillPage - localStorage has invalid activeTab, clearing localStorage"
          );
          localStorage.removeItem("billTabs");
          localStorage.removeItem("activeBillTab");
          // Force re-initialization
          setTabs([{ id: "1", name: "Bill 1", items: [] }]);
          setActiveTab("1");
          return;
        }
      }
    } catch (error) {
      console.error("BillPage - Error checking localStorage:", error);
      localStorage.removeItem("billTabs");
      localStorage.removeItem("activeBillTab");
    }

    // Ensure we have at least one tab
    if (tabs.length === 0) {
      console.log("BillPage - Creating initial tab in setup effect");
      setTabs([{ id: "1", name: "Bill 1", items: [] }]);
    }

    // Ensure we have a valid activeTab
    if (!activeTab && tabs.length > 0) {
      console.log("BillPage - Setting activeTab to first tab in setup effect");
      setActiveTab(tabs[0].id);
    }
  }, []); // Run only once on mount

  // Debug logging
  useEffect(() => {
    console.log("BillPage - Current activeTab:", activeTab);
    console.log("BillPage - Current tab:", currentTab);
    console.log("BillPage - Items being passed to BillTable:", items);
  }, [activeTab, currentTab, items]);

  // Debug logging for activeTab changes
  useEffect(() => {
    console.log("BillPage - activeTab changed to:", activeTab);
  }, [activeTab]);

  const itemsRef = useRef([]);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pdfBuffer, setPdfBuffer] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState("disconnected");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; // Default to dark if no preference
  });
  // Track the most recently added item for focus navigation
  const [lastAddedItemId, setLastAddedItemId] = useState(null);

  const printButtonRef = useRef(null);
  const connectWhatsAppButtonRef = useRef(null);

  // Utility: strip matching country code digits from the start of a phone number
  const stripMatchingCountryCode = (countryCode, digits) => {
    try {
      const codeDigits = String(countryCode || "+").replace(/\D/g, "");
      const onlyDigits = String(digits || "").replace(/\D/g, "");
      if (
        codeDigits &&
        onlyDigits.startsWith(codeDigits) &&
        onlyDigits.length > 10
      ) {
        return onlyDigits.slice(codeDigits.length);
      }
      return onlyDigits;
    } catch {
      return String(digits || "");
    }
  };

  const triggerPrintWithAnimation = () => {
    const button = printButtonRef.current;
    if (button) {
      button.style.transform = "translateX(calc(118px - 100%))";
      setTimeout(() => {
        generatePDF();
        button.style.transform = "translateX(0)";
      }, 500);
    } else {
      generatePDF();
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.body.style.backgroundColor = newTheme ? "#141416" : "#ffffff";
  };

  useEffect(() => {
    itemsRef.current = items;
  }, [items, activeTab]);

  // Persist tabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("billTabs", JSON.stringify(tabs));
    } catch (err) {
      console.error("Failed to persist bill tabs to localStorage", err);
    }
  }, [tabs]);

  // Persist active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("activeBillTab", activeTab);
    } catch (err) {
      console.error("Failed to persist active tab to localStorage", err);
    }
  }, [activeTab]);

  useEffect(() => {
    // Set initial background color
    document.body.style.backgroundColor = isDarkMode ? "#141416" : "#ffffff";
  }, [items]);

  // Check WhatsApp connection status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkWhatsAppStatus();
      if (status.status === "connected") {
        setWhatsappStatus("connected");
      } else if (status.qr) {
        setWhatsappStatus("qr");
      } else {
        setWhatsappStatus("disconnected");
      }
    };

    checkStatus();
  }, []);

  // Listen for inventory updates and sync bill values
  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      const { itemId, product, quantity, mrp } = event.detail;
      console.log("🔄 Inventory updated:", { itemId, product, quantity, mrp });

      // Update all tabs that contain this item
      setTabs((prevTabs) => {
        return prevTabs.map((tab) => {
          const hasMatchingItem = tab.items?.some(
            (item) =>
              item._id === itemId ||
              (item.product &&
                item.product.toLowerCase() === product.toLowerCase())
          );

          if (hasMatchingItem) {
            console.log(`📋 Updating tab "${tab.name}" with inventory changes`);
            const updatedItems = tab.items.map((item) => {
              if (
                item._id === itemId ||
                (item.product &&
                  item.product.toLowerCase() === product.toLowerCase())
              ) {
                return {
                  ...item,
                  mrp: mrp, // Always sync MRP from inventory
                  // Keep bill quantity as is, don't sync quantity
                  netamt: item.quantity * mrp, // Recalculate with new MRP
                };
              }
              return item;
            });

            return { ...tab, items: updatedItems };
          }
          return tab;
        });
      });

      // Show a toast notification about the sync
      toast.success(`Bill updated: "${product}" synced with inventory`, {
        duration: 2000,
      });
    };

    window.addEventListener("inventoryUpdated", handleInventoryUpdate);

    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdate);
    };
  }, []);

  // Function to add items from search
  const addItem = (item) => {
    console.log("addItem called with:", item);
    console.log("Current activeTab:", activeTab);
    console.log("Current tabs:", tabs);

    // Safety check: ensure we have a valid activeTab
    if (!activeTab) {
      console.error("addItem: No activeTab found, cannot add item");
      return;
    }

    // Safety check: ensure the activeTab exists in tabs
    const currentTabExists = tabs.find((tab) => tab.id === activeTab);
    if (!currentTabExists) {
      console.error("addItem: activeTab not found in tabs, cannot add item");
      return;
    }

    // Generate a temporary ID for new items
    const newItem = {
      _id: Date.now().toString(), // Temporary ID for newly added items
      itemCode: item.itemCode || "N/A",
      product: item.product,
      quantity: item.quantity || 1,
      mrp: item.mrp || 0,
      netamt: Math.trunc((item.quantity || 1) * (item.mrp || 0) * 10) / 10,
      isNew: true, // Mark as new item
    };

    console.log("New item to add:", newItem);

    setTabs((prevTabs) => {
      const updatedTabs = prevTabs.map((tab) =>
        tab.id === activeTab ? { ...tab, items: [...tab.items, newItem] } : tab
      );
      console.log("Updated tabs:", updatedTabs);
      return updatedTabs;
    });
    // Remember the last added item's id so Tab can jump to it
    setLastAddedItemId(newItem._id);
  };

  // Function to update items (for editing)
  const updateItem = (itemId, updatedFields) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              items: tab.items.map((item) =>
                item._id === itemId ? { ...item, ...updatedFields } : item
              ),
            }
          : tab
      )
    );
  };

  // Function to add empty row
  const addEmptyRow = () => {
    const newItem = {
      _id: `temp_${Date.now()}`,
      itemCode: `ITEM${items.length + 1}`,
      product: "",
      quantity: "",
      mrp: "",
      netamt: 0,
      isNew: true,
    };

    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTab ? { ...tab, items: [...tab.items, newItem] } : tab
      )
    );
  };

  // Function to rename tabs
  const handleTabRename = (tabId, newName) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId ? { ...tab, name: newName } : tab
      )
    );
  };

  // Tab management functions
  const handleTabChange = (tabId) => {
    console.log("BillPage - handleTabChange called with tabId:", tabId);
    console.log("BillPage - Current tabs before change:", tabs);
    setActiveTab(tabId);
  };

  const handleTabAdd = () => {
    const newTabId = (tabs.length + 1).toString();
    const newTab = {
      id: newTabId,
      name: `Bill ${newTabId}`,
      items: [],
    };
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTab(newTabId);
  };

  // Normalize tab names to remove any item counts
  const updateTabNames = () => {
    setTabs((prevTabs) =>
      prevTabs.map((tab, index) => {
        const isCustomName = !tab.name.match(/^Bill \d+/);

        if (isCustomName) {
          // Remove any trailing counts like " (1)", "(2)", or plain " 3"
          const baseName = tab.name
            .replace(/(?:\s*\(\d+\)|\s+\d+)+$/, "")
            .trim();
          return { ...tab, name: baseName };
        } else {
          // For default tabs, number by index (1..N) so gaps are removed after deletions/reloads
          const sequentialNumber = index + 1;
          return {
            ...tab,
            name: `Bill ${sequentialNumber}`,
          };
        }
      })
    );
  };

  // Update tab names whenever tabs or item counts change
  useEffect(() => {
    updateTabNames();
  }, [
    tabs.map((tab) => `${tab.id}|${tab.name}|${tab.items.length}`).join(","),
  ]);

  const handleTabClose = (tabId) => {
    if (tabs.length === 1) {
      toast.error("Cannot close the last tab");
      return;
    }

    setTabs((prevTabs) => {
      const filtered = prevTabs.filter((tab) => tab.id !== tabId);
      // Re-sequence ids to be 1..N so numbering stays compact
      return filtered.map((tab, index) => ({
        ...tab,
        id: (index + 1).toString(),
      }));
    });

    // If closing the active tab, switch to the previous tab
    if (activeTab === tabId) {
      const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
      const newActiveTab = tabs[currentIndex - 1] || tabs[currentIndex + 1];
      setActiveTab(newActiveTab.id);
    }
  };

  // Function to update items in current tab
  const setItems = (newItems) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTab ? { ...tab, items: newItems } : tab
      )
    );
  };

  // PDF Generation Function
  const generatePDF = () => {
    const currentItems = itemsRef.current || [];
    // Check if there are items to generate PDF
    if (currentItems.length === 0) {
      toast.error("No items available to generate PDF");
      return;
    }

    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set document properties
    doc.setProperties({
      title: "Invoice",
      subject: "Sales Invoice",
      creator: "BillSwift",
    });

    // Add company header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 20, { align: "center" });

    // Add date and invoice number
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    doc.text(`Invoice #: ${invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 199, 30, {
      align: "right",
    });

    // Calculate total
    const total = currentItems.reduce(
      (sum, item) => sum + (item?.netamt || 0),
      0
    );

    // Prepare table data (hide Item Code)
    const tableColumn = ["No", "Product", "Quantity", "MRP", "Net Amount"];
    const tableRows = currentItems.map((item, index) => [
      index + 1,
      item.product || "N/A",
      item.quantity || "0",
      (item.mrp || 0).toLocaleString(),
      (item.netamt || 0).toLocaleString(),
    ]);

    // Add the table
    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      tableWidth: "auto",
      styles: {
        fontSize: 9,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
        font: "helvetica",
      },
      headStyles: {
        fillColor: [51, 121, 233], // #3379E9
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 45, halign: "right" },
      },
    });

    // Add total at the bottom
    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    // Add a line before total
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 5, 200, finalY + 5);

    // Total amount text
    doc.text(`Total Amount:`, 14, finalY + 12);
    doc.text(`₹${total.toLocaleString()}`, 199, finalY + 12, {
      align: "right",
    });

    // Add footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", 105, finalY + 25, {
      align: "center",
    });
    doc.text("Generated by BillSwift", 105, finalY + 30, { align: "center" });

    // Get PDF as buffer
    const pdfBuffer = doc.output("arraybuffer");
    setPdfBuffer(pdfBuffer);

    // If a phone is already stored for this tab, send immediately without asking
    const savedPhone = (currentTab && currentTab.customerPhone) || "";
    if (whatsappStatus === "connected") {
      if (savedPhone && savedPhone.trim() !== "") {
        // Auto-send to saved phone
        handlePhoneSubmit(savedPhone.trim());
      } else {
        // Ask for phone number
        setShowPhoneModal(true);
      }
    } else {
      // Show QR code modal to connect WhatsApp - ONLY ONCE
      setShowQRModal(true);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && (e.key === "Enter" || e.code === "Enter")) {
        e.preventDefault();
        triggerPrintWithAnimation();
      }
      if (e.ctrlKey && e.key === "t") {
        e.preventDefault();
        handleTabAdd();
      }
      if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        handleTabClose(activeTab);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items, activeTab]);

  const handlePhoneSubmit = async (phoneNumber) => {
    try {
      // Persist numeric local phone on the current tab for future prints
      const inputDigits = (phoneNumber || "").replace(/\D/g, "").trim();
      const code = (currentTab?.customerPhoneCode || "+91").replace(/\s/g, "");
      const localDigits = stripMatchingCountryCode(code, inputDigits);
      const formattedPhone = `${code}${localDigits}`;
      if (localDigits) {
        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.id === activeTab ? { ...tab, customerPhone: localDigits } : tab
          )
        );
      }

      // Create message with product details
      const message =
        `*Invoice Details*\n\n` +
        items
          .map(
            (item) =>
              `• ${item.product} x ${
                item.quantity
              } = ₹${item.netamt.toLocaleString()}`
          )
          .join("\n") +
        `\n\n*Total Amount: ₹${items
          .reduce((sum, item) => sum + (item?.netamt || 0), 0)
          .toLocaleString()}*`;

      // Send WhatsApp message and PDF
      const success = await sendWhatsAppMessage(
        formattedPhone,
        message,
        pdfBuffer
      );

      if (success) {
        toast.success("Invoice sent successfully via WhatsApp!");

        // Build bill payload and persist to backend
        const subtotal = items.reduce(
          (sum, item) => sum + (Number(item?.netamt) || 0),
          0
        );
        const payload = {
          billId: currentTab?.name || "Bill",
          customer: { phone: formattedPhone },
          items: items.map((i) => ({
            product: i.product,
            mrp: Number(i.mrp) || 0,
            quantity: Number(i.quantity) || 0,
            netamt: Number(i.netamt) || 0,
          })),
          subtotal,
          discount: 0,
          total: subtotal,
          status: "finalized",
        };

        try {
          await axios.post("http://localhost:5001/bills", payload);
          toast.success("Bill saved to database");
        } catch (err) {
          console.error("Error saving bill:", err);
          toast.error("Failed to save bill to database");
        }
      } else {
        toast.error("Failed to send invoice via WhatsApp");
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast.error("Failed to send invoice via WhatsApp");
    }
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);

    // Check WhatsApp status after closing QR modal
    const checkStatus = async () => {
      const status = await checkWhatsAppStatus();
      if (status.status === "connected") {
        setWhatsappStatus("connected");
        // If now connected, show the phone modal
        setShowPhoneModal(true);
      }
    };

    checkStatus();
  };

  const handleDeleteClick = useCallback(
    (itemId) => {
      // Find the item to delete before removing it
      const currentItems =
        tabs.find((tab) => tab.id === activeTab)?.items || [];
      const itemToDelete = currentItems.find((item) => item._id === itemId);

      if (!itemToDelete) {
        console.error("Item not found for deletion:", itemId);
        return;
      }

      // Remove from local state immediately for better UX
      setTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === activeTab
            ? { ...tab, items: tab.items.filter((item) => item._id !== itemId) }
            : tab
        )
      );

      // Check if it's a temporary ID (not a MongoDB ObjectId) or if it's a new item
      const isTemporaryId = !itemId.match(/^[0-9a-fA-F]{24}$/);
      const isNewItem = itemToDelete.isNew;

      // If it's a temporary ID or new item, just remove from local state
      if (isTemporaryId || isNewItem) {
        toast.success("Item removed successfully");
        return;
      }

      // If it's an existing item from database, delete from backend
      axios
        .delete(`http://localhost:5001/deleteItem/${itemId}`)
        .then(() => {
          toast.success("Item deleted successfully");
        })
        .catch((err) => {
          // Revert the local state change if the API call fails
          setTabs((prevTabs) =>
            prevTabs.map((tab) =>
              tab.id === activeTab
                ? { ...tab, items: [...tab.items, itemToDelete] }
                : tab
            )
          );
          console.error("Delete error:", err);
          toast.error("Failed to delete item from database");
        });
    },
    [activeTab, tabs]
  );

  return (
    <div className={`flex p-6 ${isDarkMode ? "bg-[#141416]" : "bg-white"}`}>
      <SlideBar isDarkMode={isDarkMode} />
      <div className="flex-1 flex flex-col gap-6">
        {/* Tabs Section */}
        <BillTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onTabAdd={handleTabAdd}
          onTabClose={handleTabClose}
          onTabRename={handleTabRename}
          isDarkMode={isDarkMode}
        />

        {/* Search and Title Section */}
        <div
          className={`p-6 rounded-t-[24px] rounded-b-[24px] border-3 ${
            isDarkMode
              ? "bg-[#1A1A1C] border-[#1A1A1C]"
              : "bg-white border-[#f4f4f6]"
          }`}
        >
          <div className="flex items-center justify-between mb-6 pl-6">
            <div className="flex items-center gap-3">
              <h1
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-[#141416]"
                }`}
              >
                Bill Management
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isDarkMode
                    ? "bg-[#3379E9] text-white"
                    : "bg-[#3379E9] text-white"
                }`}
              >
                {currentTab?.name || "Bill 1"}
              </span>
              <div
                className={`flex items-center rounded-full overflow-hidden border ${
                  isDarkMode ? "border-white/10" : "border-black/5"
                }`}
              >
                <input
                  type="text"
                  value={currentTab?.customerPhoneCode || "+91"}
                  onChange={(e) => {
                    // Allow + and digits only
                    let v = e.target.value.replace(/[^+\d]/g, "");
                    if (!v.startsWith("+")) v = "+" + v.replace(/\+/g, "");
                    setTabs((prev) =>
                      prev.map((tab) =>
                        tab.id === activeTab
                          ? { ...tab, customerPhoneCode: v }
                          : tab
                      )
                    );
                  }}
                  className={`px-3 py-1 text-sm font-medium outline-none ${
                    isDarkMode
                      ? "bg-[#2a2a2d] text-white"
                      : "bg-[#f4f4f6] text-[#141416]"
                  }`}
                  style={{ width: 60 }}
                  title="Country code"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Phone"
                  value={currentTab?.customerPhone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setTabs((prev) =>
                      prev.map((tab) =>
                        tab.id === activeTab
                          ? { ...tab, customerPhone: value }
                          : tab
                      )
                    );
                  }}
                  className={`px-3 py-1 text-sm font-medium outline-none ${
                    isDarkMode
                      ? "bg-[#2a2a2d] text-white"
                      : "bg-[#f4f4f6] text-[#141416]"
                  }`}
                  style={{ width: 140 }}
                  title="Customer phone for this bill"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-[24px] inline-flex items-center justify-center ${
                  isDarkMode
                    ? "bg-[#2a2a2d] text-white hover:bg-[#1A1A1C]"
                    : "bg-[#f4f4f6] text-[#141416] hover:bg-[#e8e8ea]"
                }`}
              >
                {isDarkMode ? (
                  <HiSun className="text-xl" />
                ) : (
                  <HiMoon className="text-xl" />
                )}
              </button>
              <div className="relative w-[400px]">
                <SearchItemBill
                  onItemSelect={addItem}
                  onCtrlEnterPrint={triggerPrintWithAnimation}
                  onTabToTable={() => {
                    if (items.length === 0) {
                      return;
                    }

                    // Only focus on new items (items with isNew: true)
                    const newItems = items.filter((item) => item.isNew);
                    if (newItems.length === 0) {
                      // No new items, stay in search bar
                      return;
                    }

                    // Try to focus the most recently added item's first editable input (quantity)
                    if (lastAddedItemId) {
                      const row = document.querySelector(
                        `tr[data-item-id="${lastAddedItemId}"]`
                      );
                      if (row) {
                        const qtyInput = row.querySelector(
                          'input[type="number"]'
                        );
                        if (qtyInput) {
                          qtyInput.focus();
                          return;
                        }
                      }
                    }

                    // Fallback: Focus on the first new item's quantity field
                    const firstNewItem = newItems[0];
                    const firstNewItemRow = document.querySelector(
                      `tr[data-item-id="${firstNewItem._id}"]`
                    );
                    if (firstNewItemRow) {
                      const qtyInput = firstNewItemRow.querySelector(
                        'input[type="number"]'
                      );
                      if (qtyInput) {
                        qtyInput.focus();
                      }
                    }
                  }}
                  name="Add Products"
                  className={`w-full px-0 py-0 rounded-[240px] focus:outline-none flex items-center gap-4 ${
                    isDarkMode ? "bg-[#2a2a2d]" : "bg-[#f4f4f6]"
                  }`}
                  iconWrapperClassName={`px-3 py-3 rounded-full flex items-center justify-center ${
                    isDarkMode ? "bg-[#facd40]" : "bg-[#facd40]"
                  }`}
                  iconClassName={
                    isDarkMode
                      ? "text-black text-base"
                      : "text-[#141416] text-base"
                  }
                  placeholderClassName={`text-base font-medium ${
                    isDarkMode ? "text-[#767c8f]" : "text-[#141416]"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className={`px-6 ${isDarkMode ? "bg-[#1A1A1C]" : "bg-white"}`}>
            <div>
              <BillTable
                items={items}
                setItems={setItems}
                onUpdateItem={updateItem}
                isProductEditable={false}
                className={`w-full border-collapse [&_td]:border-2 [&_th]:border-2 ${
                  isDarkMode
                    ? "[&_td]:border-[#2a2a2d] [&_th]:border-[#2a2a2d]"
                    : "[&_td]:border-[#f4f4f6] [&_th]:border-[#f4f4f6]"
                }`}
                headerClassName={`font-medium ${
                  isDarkMode
                    ? "bg-[#1A1A1C] text-[#767c8f]"
                    : "bg-white text-[#767c8f]"
                }`}
                rowClassName={`${
                  isDarkMode
                    ? "text-white hover:bg-[#2a2a2d]"
                    : "text-[#141416] hover:bg-[#f4f4f6]"
                }`}
                highlightClassName={
                  isDarkMode ? "bg-[#2a2a2d]" : "bg-[#f4f4f6]"
                }
                iconClassName={`transition-colors duration-150 ${
                  isDarkMode
                    ? "text-[#767c8f] hover:text-white"
                    : "text-[#767c8f] hover:text-[#141416]"
                }`}
                cellClassName="px-6 py-4 rounded-none"
                onDeleteClick={handleDeleteClick}
                onLastCellTab={() => {
                  console.log("onLastCellTab called - focusing search bar");
                  // Focus the search bar when tabbing from the last cell (MRP field)
                  const searchInput = document.querySelector(
                    'input[placeholder="Add Products"]'
                  );
                  if (searchInput) {
                    console.log("Found search input, focusing it");
                    searchInput.focus();
                  } else {
                    console.log("Search input not found");
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {whatsappStatus === "connected" ? (
              <div className={`text-[#767c8f] text-sm flex items-center`}>
                <span className="w-2 h-2 bg-[#25D366] rounded-full mr-2"></span>
                WhatsApp Connected
              </div>
            ) : (
              <button
                ref={connectWhatsAppButtonRef}
                tabIndex={0}
                onClick={() => setShowQRModal(true)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey) {
                    e.preventDefault();
                    // Move focus back to search bar
                    const searchInput = document.querySelector(
                      'input[placeholder="Add Products"]'
                    );
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }
                }}
                className={`px-4 py-2 font-medium rounded-[24px] inline-flex items-center transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 focus:drop-shadow-[0_0_15px_rgba(51,121,233,0.4)] ${
                  isDarkMode
                    ? "bg-[#2a2a2d] hover:bg-[#1A1A1C] text-white"
                    : "bg-[#f4f4f6] hover:bg-[#e8e8ea] text-[#141416]"
                }`}
              >
                Connect WhatsApp
              </button>
            )}
            <button
              onClick={() => (window.location.href = "/bills")}
              className={`px-4 py-2 font-medium rounded-[24px] inline-flex items-center transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-[#3379E9] focus:ring-offset-2 focus:drop-shadow-[0_0_15px_rgba(51,121,233,0.4)] ${
                isDarkMode
                  ? "bg-[#3379E9] hover:bg-[#1466e4] text-white"
                  : "bg-[#3379E9] hover:bg-[#1466e4] text-white"
              }`}
            >
              View Bills
            </button>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="relative w-[150px] h-[150px] rounded-[24px] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#3379E9,_#1466e4)]"></div>
              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div>
                  <div className="text-white text-lg font-medium">Total</div>
                  <div className="text-white text-[32px] font-medium leading-none ">
                    ₹
                    {items
                      .reduce((sum, item) => sum + (item?.netamt || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="relative w-full h-10 bg-white/10 rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full flex items-center pl-4">
                    <span className="text-white/50 text-sm ml-8">Print</span>
                  </div>
                  <button
                    ref={printButtonRef}
                    tabIndex={0}
                    onClick={triggerPrintWithAnimation}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        // Move focus back to search bar
                        const searchInput = document.querySelector(
                          'input[placeholder="Add Products"]'
                        );
                        if (searchInput) {
                          searchInput.focus();
                        }
                      }
                    }}
                    className="absolute left-0 top-0 flex items-center justify-center bg-white/20 hover:bg-white/30 focus:bg-white/40 transition-all duration-500 ease-in-out rounded-full w-10 h-10 transform hover:scale-105 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] focus:shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onPhoneSubmit={handlePhoneSubmit}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center"
        modalClassName={`p-6 w-full max-w-md border rounded-[24px] shadow-xl ${
          isDarkMode
            ? "bg-[#1A1A1C]/90 border-white/10 backdrop-blur-xl"
            : "bg-white/90 border-black/5 backdrop-blur-xl"
        }`}
        headerClassName={`font-bold text-xl mb-6 ${
          isDarkMode ? "text-white" : "text-[#141416]"
        }`}
        inputClassName={`w-full p-4 rounded-[16px] mb-6 focus:outline-none border transition-colors duration-200 ${
          isDarkMode
            ? "bg-[#2a2a2d]/80 border-white/10 text-white placeholder-[#767c8f]"
            : "bg-[#f4f4f6]/80 border-black/5 text-[#141416] placeholder-[#767c8f]"
        }`}
        buttonClassName={`w-full p-4 font-medium rounded-[16px] transition-all duration-200 ${
          isDarkMode
            ? "bg-[#3379E9] hover:bg-[#1466e4] text-white"
            : "bg-[#3379E9] hover:bg-[#1466e4] text-white"
        }`}
      />

      <QRCodeModal
        isOpen={showQRModal}
        onClose={handleQRModalClose}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center"
        modalClassName={`p-6 w-full max-w-md border rounded-[24px] shadow-xl ${
          isDarkMode
            ? "bg-[#1A1A1C]/90 border-white/10 backdrop-blur-xl"
            : "bg-white/90 border-black/5 backdrop-blur-xl"
        }`}
        headerClassName={`font-bold text-xl mb-6 ${
          isDarkMode ? "text-white" : "text-[#141416]"
        }`}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default BillPage;

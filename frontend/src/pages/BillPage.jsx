import React, { useState, useEffect, useRef, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SlideBar from "../components/SlideBar";
import SearchItemBill from "../components/SearchItemBill";
import Table from "../components/Table";
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
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [{ id: "1", name: "Bill 1", items: [] }];
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedActive = localStorage.getItem("activeBillTab");
      if (savedActive) return savedActive;
    } catch (_) {}
    return "1";
  });

  // Get current tab's items
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const items = currentTab ? currentTab.items : [];

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

  // Function to add items from search
  const addItem = (item) => {
    // Generate a temporary ID for new items
    const newItem = {
      _id: Date.now().toString(), // Temporary ID for newly added items
      itemCode: item.itemCode || "N/A",
      product: item.product,
      quantity: item.quantity || 1,
      mrp: item.mrp || 0,
      netamt: (item.quantity || 1) * (item.mrp || 0),
      isNew: true, // Mark as new item
    };

    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTab ? { ...tab, items: [...tab.items, newItem] } : tab
      )
    );
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

  // Update tab names with item counts
  const updateTabNames = () => {
    setTabs((prevTabs) =>
      prevTabs.map((tab, index) => {
        const isCustomName = !tab.name.match(/^Bill \d+/);

        if (isCustomName) {
          const hasItemCount = tab.name.includes(`(${tab.items.length})`);
          if (!hasItemCount && tab.items.length > 0) {
            return { ...tab, name: `${tab.name} (${tab.items.length})` };
          }
          return tab;
        } else {
          // For default tabs, number by index (1..N) so gaps are removed after deletions/reloads
          const sequentialNumber = index + 1;
          return {
            ...tab,
            name: `Bill ${sequentialNumber}${
              tab.items.length > 0 ? ` (${tab.items.length})` : ""
            }`,
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

    // Check WhatsApp status before showing phone modal
    if (whatsappStatus === "connected") {
      // Directly show phone modal without showing connection status
      setShowPhoneModal(true);
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
        phoneNumber,
        message,
        pdfBuffer
      );

      if (success) {
        toast.success("Invoice sent successfully via WhatsApp!");
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

                    // Fallback: Focus on the first row's first input field (quantity field)
                    const firstInput = document.querySelector(
                      'input[tabindex="2"]'
                    );
                    if (firstInput) {
                      firstInput.focus();
                    } else {
                      const allInputs = document.querySelectorAll(
                        'input[type="number"]'
                      );
                      if (allInputs.length > 0) {
                        allInputs[0].focus();
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
              <Table
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
                  console.log(
                    "onLastCellTab called, whatsappStatus:",
                    whatsappStatus
                  );
                  // Focus the Connect WhatsApp button when tabbing from the last cell
                  if (whatsappStatus === "connected") {
                    // If WhatsApp is connected, focus the Print Bill button directly
                    console.log("WhatsApp connected, focusing Print button");
                    if (printButtonRef.current) {
                      printButtonRef.current.focus();
                    }
                  } else {
                    // If WhatsApp is not connected, focus the Connect WhatsApp button
                    console.log(
                      "WhatsApp not connected, focusing Connect WhatsApp button"
                    );
                    if (connectWhatsAppButtonRef.current) {
                      connectWhatsAppButtonRef.current.focus();
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-start">
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
                  // Move focus to Print Bill button
                  if (printButtonRef.current) {
                    printButtonRef.current.focus();
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
                          'input[placeholder="Search for products..."]'
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

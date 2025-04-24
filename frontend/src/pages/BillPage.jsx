import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SlideBar from "../components/SlideBar";
import SearchItemBill from "../components/SearchItemBill";
import Table from "../components/Table";
import Button from "../components/Button"; // Add this import

const BillPage = () => {
  const [items, setItems] = useState([]);

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
    };

    setItems((prevItems) => [...prevItems, newItem]);
  };

  // PDF Generation Function
  const generatePDF = () => {
    // Check if there are items to generate PDF
    if (items.length === 0) {
      alert("No items available to generate PDF");
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
      creator: "Your Company Name",
    });

    // Add company header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 20, { align: "center" });

    // Add date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 199, 30, {
      align: "right",
    });

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item?.netamt || 0), 0);

    // Prepare table data
    const tableColumn = [
      "No",
      "Item Code",
      "Product",
      "Quantity",
      "MRP",
      "Net Amount",
    ];
    const tableRows = items.map((item, index) => [
      index + 1,
      item.itemCode || "N/A",
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
        fillColor: [0, 106, 113], // Changed to match your teal theme #006A71
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10 }, // No
        1: { cellWidth: 30 }, // Item Code
        2: { cellWidth: 50 }, // Product
        3: { cellWidth: 20 }, // Quantity
        4: { cellWidth: 30, halign: "right" }, // MRP
        5: { cellWidth: 45, halign: "right" }, // Net Amount
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
    doc.text(`${total.toLocaleString()}`, 199, finalY + 12, {
      align: "right",
    });

    // Save the PDF
    doc.save(`Invoice_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex h-screen bg-[#141416]">
      <SlideBar />
      <div className="flex-1 flex flex-col p-6">
        <div className=" bg-[#1A1A1C] mt-5 rounded-[20px] h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white pl-10 pt-4">
              Bill Management
            </h1>
            <div className="relative w-1/2 mt-7 mr-7">
              <SearchItemBill onItemSelect={addItem} name="Add Products" />
            </div>
          </div>

          <div>
            <Table
              items={items}
              setItems={setItems}
              className="w-full divide-y divide-[#9ACBD0]"
              headerClassName="bg-[#F2EFE7] text-[#006A71]"
              rowClassName="hover:bg-[#F2EFE7] transition-colors duration-150"
              highlightClassName="bg-[#9ACBD0] bg-opacity-30"
            />
          </div>
        </div>

        <div className="flex flex-col items-end mt-6">
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
                  <span className="text-white/50 text-sm ml-10">Print</span>
                </div>
                <button
                  onClick={(e) => {
                    const button = e.currentTarget;
                    button.style.transform = "translateX(calc(118px - 100%))";
                    setTimeout(() => {
                      generatePDF();
                      button.style.transform = "translateX(0)";
                    }, 500);
                  }}
                  className="absolute left-0 top-0 flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all duration-500 ease-in-out rounded-full w-10 h-10 transform"
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
  );
};

export default BillPage;

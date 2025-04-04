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
    <div className="flex h-screen bg-[#F2EFE7]">
      <SlideBar />
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#006A71]">Bill Management</h1>
          <div className="relative w-1/2">
            <SearchItemBill 
              onItemSelect={addItem} 
              name="Add Products"
              className="w-full px-4 py-2 border border-[#9ACBD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48A6A7]"
            />
          </div>
        </div>
        
        <div className="flex max-h-[452px] bg-white rounded-xl overflow-hidden">
          <Table 
            items={items} 
            setItems={setItems}
            className="w-full divide-y divide-[#9ACBD0]"
            headerClassName="bg-[#F2EFE7] text-[#006A71]"
            rowClassName="hover:bg-[#F2EFE7] transition-colors duration-150"
            highlightClassName="bg-[#9ACBD0] bg-opacity-30"
          />
        </div>
        
        <div className="flex justify-between items-center mt-8">
          <div className="text-lg font-bold text-[#006A71]">
            Total: <span className="text-xl">{items.reduce((sum, item) => sum + (item?.netamt || 0), 0).toLocaleString()} Rs</span>
          </div>
          <Button 
            name="Print" 
            onClick={generatePDF}
          />
        </div>
      </div>
    </div>
  );
};

export default BillPage;
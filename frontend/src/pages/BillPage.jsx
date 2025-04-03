import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SlideBar from "../components/SlideBar";
import SearchItemBill from "../components/SearchItemBill";
import Table from "../components/Table";

const BillPage = () => {
  const [items, setItems] = useState([]);

  // console.log("Items",items)

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
        fillColor: [41, 128, 185],
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
    <div>
      <div className="flex">
        <SlideBar />
        <div className="w-[100%] flex flex-col items-center">
          <div className="relative w-full">
            <SearchItemBill onItemSelect={addItem} name="Add Products" />
          </div>
          <Table items={items} setItems={setItems} />
          <div className="flex justify-end mt-10 w-[90%] gap-7">
            <button
              className="px-3 text-[15px] p-3 rounded-[7px] border border-gray-300 font-bold transition-all duration-300 [&:hover]:bg-gray-900 [&:hover]:text-white"
              onClick={generatePDF}
            >
              Print
            </button>
            <div className="border text-[15px] p-3 bg-gray-900 text-white rounded-[10px]">
              Total:{" "}
              {items
                .reduce((sum, item) => sum + (item?.netamt || 0), 0)
                .toLocaleString()}{" "}
              Rs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPage;

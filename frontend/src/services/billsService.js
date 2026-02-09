// Bills service for API calls
// const BACKEND_BASE_URL =
//   (typeof import.meta !== "undefined" &&
//     import.meta.env &&
//     (import.meta.env.VITE_BACKEND_BASE_URL ||
//       import.meta.env.VITE_API_BASE_URL)) ||
//   (typeof process !== "undefined" &&
//     process.env &&
//     (process.env.VITE_BACKEND_BASE_URL || process.env.VITE_API_BASE_URL)) ||
//   "http://localhost:5001";
// billsService.js
const BACKEND_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_BACKEND_BASE_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL)) ||
  (typeof process !== "undefined" &&
    process.env &&
    (process.env.VITE_BACKEND_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      process.env.VITE_API_URL)) ||
  "https://bill-swift.onrender.com";

// Function to get all bills
const getAllBills = async () => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/bills`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching bills:", error);
    return { bills: [], error: "Failed to fetch bills" };
  }
};

// Function to get bill by ID
const getBillById = async (billId) => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/bills/${billId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching bill:", error);
    return { error: "Failed to fetch bill" };
  }
};

// Function to create a new bill
const createBill = async (billData) => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(billData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating bill:", error);
    return { error: "Failed to create bill" };
  }
};

// Function to update a bill
const updateBill = async (billId, billData) => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/bills/${billId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(billData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating bill:", error);
    return { error: "Failed to update bill" };
  }
};

// Function to delete a bill
const deleteBill = async (billId) => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/bills/${billId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting bill:", error);
    return { error: "Failed to delete bill" };
  }
};

export {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  BACKEND_BASE_URL,
};

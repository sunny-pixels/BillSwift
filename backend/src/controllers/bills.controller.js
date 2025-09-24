import Bill from "../models/bill.model.js";
import mongoose from "mongoose";

export const handleGetAllBills = async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json({ bills });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const handleGetBillById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ObjectId" });
    }
    const bill = await Bill.findById(id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const handleCreateBill = async (req, res) => {
  try {
    const bill = await Bill.create(req.body);
    res.status(201).json(bill);
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const handleUpdateBill = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ObjectId" });
    }
    const updated = await Bill.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Bill not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const handleDeleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ObjectId" });
    }
    const deleted = await Bill.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Bill not found" });
    res.json(deleted);
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
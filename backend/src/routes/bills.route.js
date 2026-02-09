import express from "express";
import {
  handleGetAllBills,
  handleGetBillById,
  handleCreateBill,
  handleUpdateBill,
  handleDeleteBill,
  handleSendBillPDF,
} from "../controllers/bills.controller.js";

const router = express.Router();

router.get("/", handleGetAllBills);
router.get("/:id", handleGetBillById);
router.post("/", handleCreateBill);
router.put("/:id", handleUpdateBill);
router.delete("/:id", handleDeleteBill);
router.post("/:id/send", handleSendBillPDF);

export default router;
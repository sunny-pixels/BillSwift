import express from "express";
import {
  handleGetAllBills,
  handleGetBillById,
  handleCreateBill,
  handleUpdateBill,
  handleDeleteBill,
} from "../controllers/bills.controller.js";

const router = express.Router();

router.get("/", handleGetAllBills);
router.get("/:id", handleGetBillById);
router.post("/", handleCreateBill);
router.put("/:id", handleUpdateBill);
router.delete("/:id", handleDeleteBill);

export default router;
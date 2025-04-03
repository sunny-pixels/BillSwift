import express from "express";
import Item from "../models/item.model.js"; 
import { handleGetAllItems } from "../controllers/items.controller.js"

const router = express.Router();

router.get("/", handleGetAllItems);

export default router;

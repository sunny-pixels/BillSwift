import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Item from "./models/item.model.js";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import billsRouter from "./routes/bills.route.js";
import { initializeWhatsApp } from "./utils/whatsapp.js";

dotenv.config();

const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://bill-swift-omega.vercel.app'] 
  : ['http://localhost:5173', 'http://localhost:3000', 'https://bill-swift-omega.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5001;

connectDB();

// Initialize WhatsApp connection
initializeWhatsApp().catch(err => {
  console.error('Failed to initialize WhatsApp:', err);
});

app.get("/", (req, res) => {
  Item.find({})
    .then((items) => res.json(items))
    .catch((err) => console.log(err));
});

app.use("/bills", billsRouter);

app.get("/getItem/:id", (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  Item.findById(id)
    .then((item) => res.json(item))
    .catch((err) => res.status(500).json(err));
});

app.put("/updateItem/:id", (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  Item.findByIdAndUpdate(id, req.body, { new: true })
    .then((updatedItem) => res.json(updatedItem))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

app.post("/createItem", (req, res) => {
  Item.create(req.body)
    .then((items) => res.json(items))
    .catch((err) => res.json(err));
});

app.delete("/deleteItem/:id", (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ObjectId" });
  }
  Item.findByIdAndDelete(id)
    .then((result) => res.json(result))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  //   connectDB();
});

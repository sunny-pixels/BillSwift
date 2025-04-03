import Item from "../models/item.model.js";  // add .js extension

export const handleGetAllItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// ─── Models (inline to keep seed self-contained) ─────────────────────────────

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true },
  product:  { type: String, required: true },
  quantity: { type: Number, required: true },
  mrp:      { type: Number, required: true },
  netamt:   { type: Number, required: true },
});
const Item = mongoose.models.items || mongoose.model("items", itemSchema);

const BillLineSchema = new mongoose.Schema(
  {
    itemId:   { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    product:  { type: String, required: true },
    mrp:      { type: Number, required: true },
    quantity: { type: Number, required: true },
    netamt:   { type: Number, required: true },
  },
  { _id: false }
);

const BillSchema = new mongoose.Schema(
  {
    billId:   { type: String, index: true },
    customer: { phone: String },
    items:    { type: [BillLineSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
    status:   { type: String, enum: ["draft", "finalized", "canceled"], default: "finalized" },
  },
  { timestamps: true }
);
const Bill = mongoose.models.Bill || mongoose.model("Bill", BillSchema);

// ─── Grocery inventory (piece-based) ─────────────────────────────────────────
// netamt = stock qty × mrp  (represents store stock value)

const inventoryItems = [
  { itemCode: "GRC001", product: "Aashirvaad Atta 10 kg",         quantity: 80,  mrp: 450  },
  { itemCode: "GRC002", product: "Surf Excel Detergent 3 kg",     quantity: 60,  mrp: 320  },
  { itemCode: "GRC003", product: "Tata Salt 1 kg",                quantity: 200, mrp: 25   },
  { itemCode: "GRC004", product: "Fortune Sunflower Oil 5 L",     quantity: 40,  mrp: 890  },
  { itemCode: "GRC005", product: "Amul Butter 500 g",             quantity: 90,  mrp: 285  },
  { itemCode: "GRC006", product: "Britannia Assorted Biscuits",   quantity: 150, mrp: 45   },
  { itemCode: "GRC007", product: "Maggi 2-Minute Noodles",        quantity: 300, mrp: 14   },
  { itemCode: "GRC008", product: "Haldiram Namkeen Aloo Bhujia",  quantity: 120, mrp: 160  },
  { itemCode: "GRC009", product: "Parle-G Biscuits",              quantity: 400, mrp: 10   },
  { itemCode: "GRC010", product: "Colgate Strong Teeth 300 g",    quantity: 100, mrp: 120  },
  { itemCode: "GRC011", product: "Dettol Original Soap",          quantity: 200, mrp: 68   },
  { itemCode: "GRC012", product: "Vim Dishwash Bar",              quantity: 250, mrp: 35   },
  { itemCode: "GRC013", product: "MDH Kitchen King Masala",       quantity: 180, mrp: 90   },
  { itemCode: "GRC014", product: "Lays Classic Salted Chips",     quantity: 300, mrp: 20   },
  { itemCode: "GRC015", product: "Good Day Cashew Biscuits",      quantity: 200, mrp: 30   },
  { itemCode: "GRC016", product: "Ariel Matic Detergent 2 kg",    quantity: 70,  mrp: 450  },
  { itemCode: "GRC017", product: "Cadbury Bournvita 1 kg",        quantity: 50,  mrp: 680  },
  { itemCode: "GRC018", product: "Horlicks Classic Malt 1 kg",    quantity: 50,  mrp: 590  },
  { itemCode: "GRC019", product: "Tata Tea Gold 500 g",           quantity: 120, mrp: 250  },
  { itemCode: "GRC020", product: "Brooke Bond Red Label 500 g",   quantity: 100, mrp: 295  },
  { itemCode: "GRC021", product: "Sunfeast Yippee Noodles",       quantity: 400, mrp: 15   },
  { itemCode: "GRC022", product: "MTR Ready to Eat Meals",        quantity: 100, mrp: 125  },
  { itemCode: "GRC023", product: "Kissan Mixed Fruit Jam 500 g",  quantity: 80,  mrp: 175  },
  { itemCode: "GRC024", product: "Amul Cheese Slices 200 g",      quantity: 90,  mrp: 225  },
  { itemCode: "GRC025", product: "Nutella Hazelnut Spread 350 g", quantity: 60,  mrp: 455  },
  { itemCode: "GRC026", product: "Heinz Tomato Ketchup 500 g",    quantity: 80,  mrp: 235  },
  { itemCode: "GRC027", product: "Kurkure Masala Munch",          quantity: 400, mrp: 20   },
  { itemCode: "GRC028", product: "Uncle Chipps Spicy Treat",      quantity: 300, mrp: 20   },
  { itemCode: "GRC029", product: "Mentos Fruit Roll",             quantity: 500, mrp: 5    },
  { itemCode: "GRC030", product: "Polo Mint Tablets",             quantity: 300, mrp: 40   },
  { itemCode: "GRC031", product: "Fortune Refined Rice Oil 1 L",  quantity: 200, mrp: 185  },
  { itemCode: "GRC032", product: "Saffola Gold Oil 5 L",          quantity: 60,  mrp: 950  },
  { itemCode: "GRC033", product: "Dabur Honey 500 g",             quantity: 100, mrp: 320  },
  { itemCode: "GRC034", product: "Real Fruit Power Juice 1 L",    quantity: 150, mrp: 85   },
  { itemCode: "GRC035", product: "Tropicana Orange Juice 1 L",    quantity: 100, mrp: 140  },
  { itemCode: "GRC036", product: "Sprite PET Bottle 2 L",         quantity: 120, mrp: 90   },
  { itemCode: "GRC037", product: "Coca-Cola PET Bottle 2 L",      quantity: 120, mrp: 95   },
  { itemCode: "GRC038", product: "Amul Taaza Milk Tetrapack 1 L", quantity: 200, mrp: 68   },
  { itemCode: "GRC039", product: "Nescafe Classic Instant 200 g", quantity: 80,  mrp: 450  },
  { itemCode: "GRC040", product: "Kellogg's Corn Flakes 875 g",   quantity: 70,  mrp: 280  },
  { itemCode: "GRC041", product: "Quaker Oats 2 kg",              quantity: 60,  mrp: 390  },
  { itemCode: "GRC042", product: "Milo Cereal Drink 400 g",       quantity: 80,  mrp: 430  },
  { itemCode: "GRC043", product: "Saffola Oats 1 kg",             quantity: 90,  mrp: 295  },
  { itemCode: "GRC044", product: "Pampers Baby Dry Diapers L40",  quantity: 30,  mrp: 1290 },
  { itemCode: "GRC045", product: "Himalaya Anti-Dandruff Shampoo",quantity: 80,  mrp: 245  },
  { itemCode: "GRC046", product: "H&S Smooth & Silky Shampoo",    quantity: 70,  mrp: 395  },
  { itemCode: "GRC047", product: "Whisper Ultra Soft Pads L8",    quantity: 60,  mrp: 285  },
  { itemCode: "GRC048", product: "Gillette Guard Razor Blades",   quantity: 100, mrp: 175  },
  { itemCode: "GRC049", product: "Odonil Room Freshener 50 g",    quantity: 100, mrp: 120  },
  { itemCode: "GRC050", product: "Colgate MaxFresh 300 g",        quantity: 80,  mrp: 320  },
  { itemCode: "GRC051", product: "Santoor Sandal Soap 4pk",       quantity: 120, mrp: 136  },
  { itemCode: "GRC052", product: "Lux Soft Glow Soap 4pk",        quantity: 100, mrp: 327  },
];

// Compute netamt for inventory (stock value)
const inventoryWithNetamt = inventoryItems.map(i => ({
  ...i,
  netamt: i.quantity * i.mrp,
}));

// ─── Bill items that total exactly ₹1,87,601 ─────────────────────────────────
// Each line: { product, mrp, quantity, netamt }
// Verified sum = 187601

const billLines = [
  { product: "Aashirvaad Atta 10 kg",         mrp: 450,  quantity: 5,  netamt: 2250  },
  { product: "Surf Excel Detergent 3 kg",     mrp: 320,  quantity: 8,  netamt: 2560  },
  { product: "Tata Salt 1 kg",                mrp: 25,   quantity: 20, netamt: 500   },
  { product: "Fortune Sunflower Oil 5 L",     mrp: 890,  quantity: 6,  netamt: 5340  },
  { product: "Amul Butter 500 g",             mrp: 285,  quantity: 12, netamt: 3420  },
  { product: "Britannia Assorted Biscuits",   mrp: 45,   quantity: 50, netamt: 2250  },
  { product: "Maggi 2-Minute Noodles",        mrp: 14,   quantity: 100,netamt: 1400  },
  { product: "Haldiram Namkeen Aloo Bhujia",  mrp: 160,  quantity: 15, netamt: 2400  },
  { product: "Parle-G Biscuits",              mrp: 10,   quantity: 100,netamt: 1000  },
  { product: "Colgate Strong Teeth 300 g",    mrp: 120,  quantity: 30, netamt: 3600  },
  { product: "Dettol Original Soap",          mrp: 68,   quantity: 40, netamt: 2720  },
  { product: "Vim Dishwash Bar",              mrp: 35,   quantity: 60, netamt: 2100  },
  { product: "MDH Kitchen King Masala",       mrp: 90,   quantity: 25, netamt: 2250  },
  { product: "Lays Classic Salted Chips",     mrp: 20,   quantity: 80, netamt: 1600  },
  { product: "Good Day Cashew Biscuits",      mrp: 30,   quantity: 60, netamt: 1800  },
  { product: "Ariel Matic Detergent 2 kg",    mrp: 450,  quantity: 10, netamt: 4500  },
  { product: "Cadbury Bournvita 1 kg",        mrp: 680,  quantity: 8,  netamt: 5440  },
  { product: "Horlicks Classic Malt 1 kg",    mrp: 590,  quantity: 10, netamt: 5900  },
  { product: "Tata Tea Gold 500 g",           mrp: 250,  quantity: 15, netamt: 3750  },
  { product: "Brooke Bond Red Label 500 g",   mrp: 295,  quantity: 18, netamt: 5310  },
  { product: "Sunfeast Yippee Noodles",       mrp: 15,   quantity: 80, netamt: 1200  },
  { product: "MTR Ready to Eat Meals",        mrp: 125,  quantity: 30, netamt: 3750  },
  { product: "Kissan Mixed Fruit Jam 500 g",  mrp: 175,  quantity: 12, netamt: 2100  },
  { product: "Amul Cheese Slices 200 g",      mrp: 225,  quantity: 15, netamt: 3375  },
  { product: "Nutella Hazelnut Spread 350 g", mrp: 455,  quantity: 8,  netamt: 3640  },
  { product: "Heinz Tomato Ketchup 500 g",    mrp: 235,  quantity: 12, netamt: 2820  },
  { product: "Kurkure Masala Munch",          mrp: 20,   quantity: 100,netamt: 2000  },
  { product: "Uncle Chipps Spicy Treat",      mrp: 20,   quantity: 80, netamt: 1600  },
  { product: "Mentos Fruit Roll",             mrp: 5,    quantity: 100,netamt: 500   },
  { product: "Polo Mint Tablets",             mrp: 40,   quantity: 30, netamt: 1200  },
  { product: "Fortune Refined Rice Oil 1 L",  mrp: 185,  quantity: 50, netamt: 9250  },
  { product: "Saffola Gold Oil 5 L",          mrp: 950,  quantity: 15, netamt: 14250 },
  { product: "Dabur Honey 500 g",             mrp: 320,  quantity: 20, netamt: 6400  },
  { product: "Real Fruit Power Juice 1 L",    mrp: 85,   quantity: 50, netamt: 4250  },
  { product: "Tropicana Orange Juice 1 L",    mrp: 140,  quantity: 30, netamt: 4200  },
  { product: "Sprite PET Bottle 2 L",         mrp: 90,   quantity: 40, netamt: 3600  },
  { product: "Coca-Cola PET Bottle 2 L",      mrp: 95,   quantity: 40, netamt: 3800  },
  { product: "Amul Taaza Milk Tetrapack 1 L", mrp: 68,   quantity: 60, netamt: 4080  },
  { product: "Nescafe Classic Instant 200 g", mrp: 450,  quantity: 10, netamt: 4500  },
  { product: "Kellogg's Corn Flakes 875 g",   mrp: 280,  quantity: 18, netamt: 5040  },
  { product: "Quaker Oats 2 kg",              mrp: 390,  quantity: 15, netamt: 5850  },
  { product: "Milo Cereal Drink 400 g",       mrp: 430,  quantity: 12, netamt: 5160  },
  { product: "Saffola Oats 1 kg",             mrp: 295,  quantity: 15, netamt: 4425  },
  { product: "Pampers Baby Dry Diapers L40",  mrp: 1290, quantity: 8,  netamt: 10320 },
  { product: "Himalaya Anti-Dandruff Shampoo",mrp: 245,  quantity: 15, netamt: 3675  },
  { product: "H&S Smooth & Silky Shampoo",    mrp: 395,  quantity: 12, netamt: 4740  },
  { product: "Whisper Ultra Soft Pads L8",    mrp: 285,  quantity: 10, netamt: 2850  },
  { product: "Gillette Guard Razor Blades",   mrp: 175,  quantity: 12, netamt: 2100  },
  { product: "Odonil Room Freshener 50 g",    mrp: 120,  quantity: 10, netamt: 1200  },
  { product: "Colgate MaxFresh 300 g",        mrp: 320,  quantity: 8,  netamt: 2560  },
  { product: "Santoor Sandal Soap 4pk",       mrp: 136,  quantity: 13, netamt: 1768  },
  { product: "Lux Soft Glow Soap 4pk",        mrp: 327,  quantity: 4,  netamt: 1308  },
];

// Verify total
const grandTotal = billLines.reduce((s, l) => s + l.netamt, 0);
console.log("Computed grand total:", grandTotal); // Should be 187601

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // ── Wipe existing collections ──
  await Item.deleteMany({});
  await Bill.deleteMany({});
  console.log("Cleared existing items and bills");

  // ── Insert inventory items ──
  await Item.insertMany(inventoryWithNetamt);
  console.log(`Inserted ${inventoryWithNetamt.length} inventory items`);

  // ── Insert one finalized bill with exact total ──
  const subtotal = grandTotal; // 187601
  await Bill.create({
    billId: "Sharma General Store - Daily Stock Bill",
    customer: { phone: "+919876543210" },
    items: billLines,
    subtotal,
    discount: 0,
    total: subtotal,
    status: "finalized",
  });
  console.log(`Inserted bill with total ₹${subtotal.toLocaleString("en-IN")}`);

  await mongoose.disconnect();
  console.log("Done — MongoDB seeded successfully ✓");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

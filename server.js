const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// pehle .env load karo
dotenv.config();

// Database connection
const sequelize = require("./config/db");

// Import routes


const adminRoutes = require("./routes/Admin/adminRoutes"); //for admin routes
const admincategoryRoutes = require("./routes/Admin/admincategoryRoutes");



const userRoutes = require("./routes/Api/userRoutes");
const addressRoutes = require("./routes/Api/addressRoutes");
const cartRoutes = require("./routes/Api/cartRoutes");
const categoryRoutes = require("./routes/Api/categoriesRoutes");
const orderRoutes = require("./routes/Api/orderRoutes");
const productRoutes = require("./routes/Api/productsRoutes");
const restaurantRoutes = require("./routes/Api/restaurantRoutes");
const settingRoutes = require("./routes/Api/settingRoutes");
const feedbackRoutes = require("./routes/Api/feedbackRoutes");
const favoriteRoutes = require("./routes/Api/favoriteRoutes");
const searchRoutes = require("./routes/Api/searchRoutes");


// Express app init
const app = express();

// ✅ View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use((req, res, next) => {
  console.log("Incoming Request:", req.method, req.url);
  next();
});
// Middleware
app.use(express.json({ limit: "10mb" })); // JSON request body limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Form-data / x-www-form-urlencoded

// ✅ Admin routes (views render karne ke liye)
app.use("/admin", adminRoutes);
app.use("/admincategories", admincategoryRoutes);  




// Routes
app.use("/api/user", userRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/filters", categoryRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/product", productRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/search", searchRoutes);


// Default route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// Start server after DB connection
sequelize
  .sync()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection failed:", err);
  });

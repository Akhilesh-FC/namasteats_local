const express = require("express");
const router = express.Router();

// ✅ Home Page
router.get("/", (req, res) => {
  res.render("index", { title: "Admin Dashboard" });
});

router.get("/tables", (req, res) => {
  res.render("Category/index.ejs");
});

module.exports = router;

const express = require("express");
const router = express.Router();

// Controller se function import
const { categories } = require("../../controllers/Admin/CategoryController");

// Route
router.get("/categories", categories);

module.exports = router;

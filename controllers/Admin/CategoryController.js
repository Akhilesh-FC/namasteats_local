const { sequelize, DataTypes } = require("../../config/db");
//const CategoryModel = require("../../models/Category");
//console.log("drgrdyrt",sequelize)
// Model init
const { Category } = require("../../models");

exports.categories = async (req, res) => {
  try {
    const allCategories = await Category.findAll({
      attributes: [
        "id", "name", "description", "icon", "image", "veg_type", "status", "created_at", "updated_at"
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      status: true,
      message: "Categories fetched successfully",
      data: allCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      status: false,
      message: "Server Error",
    });
  }
};

const express = require("express");
const { restaurantProducts,getRestaurantProducts,
} = require("../../controllers/Api/restaurantController");

const router = express.Router();

router.get("/restaurantProducts/:id", restaurantProducts);
router.post("/res_products", getRestaurantProducts);


module.exports = router;

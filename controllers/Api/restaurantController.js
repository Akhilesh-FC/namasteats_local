const { QueryTypes } = require("sequelize");
const sequelize = require("../../config/db");
const { Category, Product, Restaurant, RestaurantOffer, RestaurantRating, RestaurantTiming, ProductMedia,UnitType,ProductVariant} = require("../../models");



// GET /api/restaurants/:id/products
exports.restaurantProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ status: false, message: "Restaurant ID is required" });
    }

    // ✅ Restaurant ke sath products aur associations
    const restaurant = await Restaurant.findOne({
      where: { id, is_active: 1 },
      attributes: ["id", "name", "restaurant_title", "veg_type", "address", "rating", "delivery_time", "distance"],
      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id", "name", "description", "price", "thumbnail_image", "veg_type", "status"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "description", "icon", "image", "veg_type"],
            },
            {
              model: ProductMedia,
              as: "media",
              attributes: ["id", "type", "file_url"],
            }
          ]
        },
        {
          model: RestaurantOffer,
          as: "offers",
          attributes: ["id", "title", "description", "discount_percent", "valid_till"]
        },
        {
          model: RestaurantRating,
          as: "ratings",
          attributes: ["id", "user_id", "rating", "review"]
        },
        {
          model: RestaurantTiming,
          as: "timings",
          attributes: ["id", "day_of_week", "open_time", "close_time"]
        }
      ]
    });

    if (!restaurant) {
      return res.status(400).json({ status: false, message: "Restaurant not found" });
    }

    // ✅ Response format
    return res.json({
      status: true,
      message: "Restaurant with products fetched successfully!",
      data: restaurant
    });

  } catch (error) {
    console.error("Restaurant Products API Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};


// ✅ Get restaurant with details + recommended products + offers, ratings, timings
exports.getRestaurantProducts = async (req, res) => {
  try {
    const { restaurant_id } = req.body; // 🔄 ab body se id lenge

    if (!restaurant_id) {
      return res.status(400).json({
        status: false,
        message: "Restaurant ID is required",
      });
    }

    // ✅ Restaurant + products + offers + timings + product_variants + unit_types
    const restaurant = await Restaurant.findOne({
      where: { id: restaurant_id },
      attributes: ["id", "name", "distance", "address", "image", "veg_type","video", "rating", "delivery_time"], // ✅ delivery_time added

      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id", "name", "price","veg_type","description", "thumbnail_image"],

          include: [
            {
              model: ProductVariant,
              as: "variants",
              attributes: ["id", "name", "quantity", "price", "is_available"],

              include: [
                {
                  model: UnitType,
                  as: "unitType",
                  attributes: ["id", "name", "short_code"],
                },
              ],
            },
          ],
        },
        {
          model: RestaurantOffer,
          as: "offers",
          attributes: ["id", "title", "description", "discount_percent", "valid_till"],
        },
        {
          model: RestaurantTiming,
          as: "timings",
          attributes: ["id", "day_of_week", "open_time", "close_time"],
        },
      ],
    });

    if (!restaurant) {
      return res.status(404).json({
        status: false,
        message: "Restaurant not found",
      });
    }

    // ✅ Response format
    res.json({
      status: true,
      message: "Restaurant details with products + variants fetched successfully",
      data: {
        restaurant_details: {
          res_id: restaurant.id,
          name: restaurant.name,
          distance: restaurant.distance,
          address: restaurant.address,
          image: restaurant.image,
		  veg_type: restaurant.veg_type,
          video: restaurant.video,
          rating: restaurant.rating,
          delivery_time: restaurant.delivery_time, // ✅ Added here
          offers: restaurant.offers,
          timings: restaurant.timings,
		  res_pro_title: "Rated for you", // ✅ Restaurant case
        },
        recommended_for_you: {
          title: "Recommended For You", // ✅ Title block added
          products: restaurant.products.map((prod) => ({
            p_id: prod.id,
            name: prod.name,
			veg_type:prod.veg_type,
            description: prod.description,
			price:prod.price,
            image: prod.thumbnail_image,
			  res_pro_title: "Dish", // ✅ Restaurant case
            variants: prod.variants.map((variant) => ({
              v_id: variant.id,
              name: variant.name,
              quantity: variant.quantity,
              price: variant.price,
              is_available: variant.is_available,
              unit_type: variant.unitType
                ? {
                    id: variant.unitType.id,
                    name: variant.unitType.name,
                    short_code: variant.unitType.short_code,
                  }
                : null,
            })),
          })),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getRestaurantProducts:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};



// ✅ Get restaurant with details + recommended products + offers, ratings, timings
exports.getRestaurantProducts_old = async (req, res) => {
  try {
    const { restaurant_id } = req.body; // 🔄 ab body se id lenge

    if (!restaurant_id) {
      return res.status(400).json({
        status: false,
        message: "Restaurant ID is required",
      });
    }

    // ✅ Restaurant + products + offers + timings
    const restaurant = await Restaurant.findOne({
      where: { id: restaurant_id },
      attributes: ["id", "name", "distance", "address", "image", "video", "rating"],

      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id", "name", "description", "price", "thumbnail_image"],
        },
        {
          model: RestaurantOffer,
          as: "offers",
          attributes: ["id", "title", "description", "discount_percent", "valid_till"],
        },
        {
          model: RestaurantTiming,
          as: "timings",
          attributes: ["id", "day_of_week", "open_time", "close_time"],
        },
      ],
    });

    if (!restaurant) {
      return res.status(404).json({
        status: false,
        message: "Restaurant not found",
      });
    }

    // ✅ Response format
    res.json({
      status: true,
      message: "Restaurant details with recommended products fetched successfully",
      data: {
        restaurant_details: {
          res_id: restaurant.id,
          name: restaurant.name,
          distance: restaurant.distance,
          address: restaurant.address,
          image: restaurant.image,
          video: restaurant.video,
          offers: restaurant.offers,
          timings: restaurant.timings,
        },
        recommended_for_you: restaurant.products.map((prod) => ({
          p_id: prod.id,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          image: prod.thumbnail_image,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error in getRestaurantProducts:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};




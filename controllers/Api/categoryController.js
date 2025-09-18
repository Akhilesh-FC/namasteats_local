const { Op, fn, col ,where, cast} = require("sequelize");
const { Category,SubCategory,Filter, Product, Restaurant, RestaurantOffer, RestaurantRating, RestaurantTiming, ProductMedia,ProductVariant} = require("../../models");


exports.categories_lists = async (req, res) => {
  try {
    const { cat_id, sub_category_id, filter_ids, latitude, longitude } = req.body;

    // ✅ Fetch categories with sub-categories and products
    const categories = await Category.findAll({
      where: cat_id ? { id: cat_id, status: 1 } : { status: 1 },
      order: [["id", "ASC"]],
      attributes: ["id", "name", "description", "icon", "image", "veg_type"],
      include: [
        {
          model: SubCategory,
          as: "sub_categories",
          where: sub_category_id ? { id: sub_category_id } : undefined,
          required: false,
          attributes: ["id", "name", "description", "icon", "image", "veg_type"],
          include: [
            {
              model: Product,
              as: "products",
              required: false,
              attributes: ["id", "name", "description", "price", "thumbnail_image", "status", "category_id", "sub_category_id"],
              include: [
                {
                  model: Restaurant,
                  as: "restaurant",
                  attributes: ["id", "name", "restaurant_title", "veg_type", "distance", "delivery_time", "rating", "latitude", "longitude", "image", "is_active"],
                  include: [
                    { model: RestaurantOffer, as: "offers", attributes: ["id", "title", "description", "discount_percent", "valid_till"] }
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Product,
          as: "products",
          required: false,
          attributes: ["id", "name", "price", "thumbnail_image", "category_id"],
          include: [
            {
              model: Restaurant,
              as: "restaurant",
              attributes: ["id", "name", "restaurant_title", "veg_type", "distance", "delivery_time", "rating", "latitude", "longitude", "image", "is_active"],
              include: [
                { model: RestaurantOffer, as: "offers", attributes: ["id", "title", "description", "discount_percent", "valid_till"] }
              ],
            },
          ],
        },
      ],
    });

    // ✅ Filter function based on filter_ids
    const applyFilters = (restaurant, product) => {
      if (!restaurant) return false;

      // 1 → Rating >= 4
      if (filter_ids?.includes(1) && (!restaurant.rating || restaurant.rating < 4)) return false;

      // 2 → Under 30 Min
      if (filter_ids?.includes(2) && restaurant.delivery_time) {
        const minTime = parseInt(restaurant.delivery_time.split("-")[0]);
        if (isNaN(minTime) || minTime > 30) return false;
      }

      // 3 → Price < 300
      if (filter_ids?.includes(3) && product.price && product.price > 300) return false;

      // 4 → Great offer (discount >= 20%)
      if (filter_ids?.includes(4) && (!restaurant.offers || !restaurant.offers.some(o => o.discount_percent >= 20))) return false;

      return true;
    };

    // ✅ Helper to map restaurant data
    const mapRestaurantData = (prod) => {
      const r = prod.restaurant;
      if (!applyFilters(r, prod)) return null;
      return {
        res_id: r.id,
        name: r.name,
        restaurant_title: r.restaurant_title,
        rating: r.rating,
        distance: r.distance,
        delivery_time: r.delivery_time,
        latitude: r.latitude,
        longitude: r.longitude,
        veg_type: r.veg_type,
        thumbnail_image: r.image,
        offers: r.offers || [],
        res_pro_title: "Rated for you",   // ✅ Restaurant case
      };
    };

    const recommendedMap = {};
    const allRestaurantsMap = {};
    const allSubCategories = [];

    categories.forEach((cat) => {
      cat.sub_categories.forEach((sub) => {
        const subProducts = sub.products
          .map((prod) => ({
            p_id: prod.id,
            name: prod.name,
            description: prod.description,
            price: prod.price,
            thumbnail_image: prod.thumbnail_image || null,
            status: prod.status,
            cat_id: prod.category_id,
            sub_cat_id: prod.sub_category_id,
            restaurant: mapRestaurantData(prod),
            res_pro_title: "Dish",   // ✅ Product case
          }))
          .filter(p => p.restaurant !== null);

        allSubCategories.push({
          cat_id: cat.id,    
          sub_cat_id: sub.id,
          name: sub.name,
          description: sub.description,
          icon: sub.icon,
          image: sub.image || null,
          veg_type: sub.veg_type,
          products: subProducts,
        });

        subProducts.forEach((prod) => {
          const r = prod.restaurant;
          if (!r) return;

          if (!recommendedMap[r.res_id]) recommendedMap[r.res_id] = r;
          if (!allRestaurantsMap[r.res_id]) allRestaurantsMap[r.res_id] = { ...r, banner: [] };
          allRestaurantsMap[r.res_id].banner.push({
            p_id: prod.p_id,
            name: prod.name,
            price: prod.price,
            image: prod.thumbnail_image,
            res_pro_title: "Dish",   // ✅ Banner me bhi add kar diya
          });
        });
      });

      // Direct category products
      cat.products.forEach((prod) => {
        const r = mapRestaurantData(prod);
        if (!r) return;

        const productData = {
          p_id: prod.id,
          name: prod.name,
          price: prod.price,
          cat_id: prod.category_id,
          restaurant: r,
          res_pro_title: "Dish",   // ✅ Product case
        };

        if (!recommendedMap[r.res_id]) recommendedMap[r.res_id] = r;
        const resId = r.res_id;
        if (!allRestaurantsMap[resId]) allRestaurantsMap[resId] = { ...r, banner: [] };
        allRestaurantsMap[resId].banner.push({
          p_id: productData.p_id,
          name: productData.name,
          price: productData.price,
          image: prod.thumbnail_image,
          res_pro_title: "Dish",   // ✅ Banner me bhi add kar diya
        });
      });
    });

    return res.json({
      status: true,
      message: "Subcategories, Recommended & Restaurants fetched successfully!",
      data: {
        latitude: latitude || null,        
        longitude: longitude || null,
        sub_categories: allSubCategories,
        recommended_for_you: { title: "Recommended for you", restaurants: Object.values(recommendedMap) },
        all_restaurants: { title: "Restaurant deliver to you", total_count: Object.values(allRestaurantsMap).length, restaurants: Object.values(allRestaurantsMap) },
      },
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};


 
/////////////////////////////

exports.filterRestaurants = async (req, res) => {
  try {
    const { rating, time, price, great_offer } = req.query;

    // ✅ Active restaurants only
    let where = { is_active: 1 };

    // ✅ Rating filter
    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    // ✅ Delivery time filter ("30-35 Min" -> check min <= time)
    if (time) {
      where.delivery_time = { [Op.ne]: null }; // just ensure not null
    }

    // ✅ Fetch restaurants with products + offers
    const restaurants = await Restaurant.findAll({
      where,
      attributes: [
        "id",
        "name",
        "restaurant_title",
        "veg_type",
        "address",
        "distance",
        "latitude",
        "longitude",
        "image",
        "is_active",
        "delivery_time",
        "rating",
      ],
      include: [
        {
          model: Product,
          as: "products",
          attributes: ["id", "name", "price", "thumbnail_image", "category_id"],
          include: [
            {
              model: ProductVariant,
              as: "variants",
              attributes: ["id", "product_id", "price"],
            },
          ],
        },
        {
          model: RestaurantOffer,
          as: "offers",
          attributes: ["id", "title", "description", "discount_percent"],
        },
      ],
    });

    // ✅ Mapping + Filtering logic
    const recommendedRestaurantsMap = {};
    const restaurantsMap = {};

    restaurants.forEach((res) => {
      // --- Delivery time filter ---
      if (time && res.delivery_time) {
        const minTime = parseInt(res.delivery_time.split("-")[0]); // e.g. "30-35 Min"
        if (isNaN(minTime) || minTime > parseInt(time)) return; // skip if not matching
      }

      // --- Great offer filter ---
  if (great_offer && Array.isArray(res.offers)) {
    const minOffer = parseFloat(great_offer);
    const filteredOffers = res.offers.filter(
        (o) => parseFloat(o.discount_percent) >= minOffer
    );
    if (filteredOffers.length === 0) return; // skip restaurant
    res.offers = filteredOffers;
}




      // --- Price filter ---
      if (price) {
        let hasCheapProduct = false;
        res.products.forEach((prod) => {
          if (prod.variants && prod.variants.length > 0) {
            prod.variants.forEach((v) => {
              if (v.price <= parseFloat(price)) {
                hasCheapProduct = true;
              }
            });
          } else if (prod.price && prod.price <= parseFloat(price)) {
            hasCheapProduct = true;
          }
        });
        if (!hasCheapProduct) return;
      }

      // --- Recommended for you ---
      if (!recommendedRestaurantsMap[res.id]) {
        recommendedRestaurantsMap[res.id] = {
          res_id: res.id,
          name: res.name,
          restaurant_title: res.restaurant_title,
          rating: res.rating,
          distance: res.distance,
          delivery_time: res.delivery_time,
          latitude: res.latitude,
          longitude: res.longitude,
          veg_type: res.veg_type,
          thumbnail_image: res.image,
        };
      }

      // --- All restaurants (deliver to you) ---
      if (!restaurantsMap[res.id]) {
        const restaurantProducts = res.products.map((p) => ({
          p_id: p.id,
          name: p.name,
          price: p.price,
          image: p.thumbnail_image,
        }));

        restaurantsMap[res.id] = {
          res_id: res.id,
          name: res.name,
          restaurant_title: res.restaurant_title,
          rating: res.rating,
          distance: res.distance,
          delivery_time: res.delivery_time,
          latitude: res.latitude,
          longitude: res.longitude,
          veg_type: res.veg_type,
          offers: res.offers || [],
          banner: restaurantProducts,
        };
      }
    });

    // ✅ Final response format
    const recommended_for_you = {
      title: "Recommended for you",
      restaurants: Object.values(recommendedRestaurantsMap),
    };

    const allRestaurants = {
      title: "Restaurant deliver to you",
      total_count: Object.values(restaurantsMap).length,
      restaurants: Object.values(restaurantsMap),
    };

    return res.json({
      status: true,
      message: "Restaurants fetched successfully",
      data: {
        recommended_for_you,
        all_restaurants: allRestaurants,
      },
    });
  } catch (error) {
    console.error("❌ Filter API Error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};


////////////////////////


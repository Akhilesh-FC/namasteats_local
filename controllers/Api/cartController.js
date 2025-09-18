const { Op, Sequelize } = require("sequelize");
const { Cart, Product,Restaurant  } = require("../../models"); // import from index.js
//const { sequelize } = require("../../config/db"); // apna sequelize config import kro
const sequelize = require("../../config/db");

exports.addOrRemoveCart = async (req, res) => {
  try {
    let { user_id, product_id, restaurant_id, quantity } = req.body;

    // 🔄 Convert strings to numbers safely
    product_id = parseInt(product_id) || 0;
    restaurant_id = parseInt(restaurant_id) || null;
    quantity = quantity !== "" && quantity !== null ? parseInt(quantity) : 0;

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "user_id is required",
      });
    }

    // ✅ STEP 1: Agar product_id null ya 0 hai → direct remove (bina quantity check)
    if (!product_id || product_id === 0) {
      await Cart.destroy({
        where: { user_id, restaurant_id },
      });

      return res.json({
        status: true,
        message: "Product removed from cart (product_id null/0)",
      });
    }

    // ✅ STEP 2: product_id valid hai → normal flow
    let cartItem = await Cart.findOne({
      where: { user_id, product_id, restaurant_id },
    });

    if (cartItem) {
      // ✅ Agar quantity 0 → delete
      if (quantity === 0) {
        await Cart.destroy({
          where: { user_id, product_id, restaurant_id },
        });

        return res.json({
          status: true,
          message: "Product removed from cart (quantity 0)",
        });
      }

      // ✅ Agar quantity > 0 → update
      await Cart.update(
        { quantity },
        { where: { id: cartItem.id } }
      );

      return res.json({
        status: true,
        message: "Cart updated successfully",
      });
    } else {
      // ✅ Agar item cart me nahi hai aur quantity > 0 hai to add karo
      if (quantity > 0) {
        await Cart.create({ user_id, product_id, restaurant_id, quantity });

        return res.json({
          status: true,
          message: "Product added to cart successfully",
        });
      }

      return res.json({
        status: false,
        message: "Quantity must be greater than 0 to add",
      });
    }
  } catch (error) {
    console.error("❌ Error in addOrRemoveCart:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



//const sequelize = require("../config/db"); // apna sequelize import

exports.getCart = async (req, res) => {
  try {
    const { user_id } = req.body; // POST body me bhej rahe ho

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "user_id is required",
      });
    }

    // ✅ Raw SQL join
    const [rows] = await sequelize.query(
      `SELECT 
         c.id AS cart_id, 
         c.quantity, 
         r.id AS restaurant_id, 
         r.name AS restaurant_name, 
         r.image AS restaurant_image,
         p.id AS product_id, 
         p.name AS product_name, 
         p.price, 
         p.thumbnail_image
       FROM cart c
       JOIN restaurants r ON c.restaurant_id = r.id
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY r.id`,
      {
        replacements: [user_id],
      }
    );

    if (!rows.length) {
      return res.json({
        status: true,
        message: "Cart is empty",
        data: [],
      });
    }

    // ✅ Restaurant-wise grouping
    const restaurantMap = new Map();

    rows.forEach((row) => {
      const restId = row.restaurant_id;

      if (!restaurantMap.has(restId)) {
        restaurantMap.set(restId, {
          id: restId,
          name: row.restaurant_name,
          image: row.restaurant_image,
          products: [],
        });
      }

      restaurantMap.get(restId).products.push({
        id: row.product_id,
        name: row.product_name,
        price: row.price,
        thumbnail_image: row.thumbnail_image,
        quantity: row.quantity,
        cart_id: row.cart_id,
      });
    });

    // ✅ Final response
    const finalData = Array.from(restaurantMap.values());

    return res.json({
      status: true,
      message: "Cart fetched successfully",
      data: finalData,
    });

  } catch (error) {
    console.error("❌ getCart error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getCart_olddddd = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ status: false, message: "user_id is required" });
  }

  try {
    // Cart + Product fetch
    const cartItems = await Cart.findAll({
      where: { user_id },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "thumbnail_image", "restaurant_id"],
        }
      ],
      raw: true,
      nest: true
    });

    // Restaurant-wise group
    let restaurantMap = {};

    for (let item of cartItems) {
      const restId = item.product.restaurant_id;

      if (!restaurantMap[restId]) {
        // restaurant info fetch
        const restaurant = await Restaurant.findOne({
          where: { id: restId },
          attributes: ["id", "name", "image"],
          raw: true
        });

        if (restaurant) {
          restaurantMap[restId] = {
            ...restaurant,
            products: []
          };
        }
      }

      if (restaurantMap[restId]) {
        restaurantMap[restId].products.push({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          thumbnail_image: item.product.thumbnail_image,
          quantity: item.quantity,
          cart_id: item.id
        });
      }
    }

    const responseData = Object.values(restaurantMap);

    return res.json({
      status: true,
      message: "Cart fetched successfully",
      data: responseData
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

exports.getCart_old = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ status: false, message: "user_id is required" });
  }

  try {
    const cartItems = await Cart.findAll({
      where: { user_id },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "thumbnail_image", "restaurant_id"],
        }
      ],
      raw: true,
      nest: true
    });

    // Restaurant details replace inside "restaurant_id"
    for (let item of cartItems) {
      if (item.product.restaurant_id) {
        const restaurant = await Restaurant.findOne({
          where: { id: item.product.restaurant_id },
          attributes: ["id", "name", "image"]
        });

        // 👇 yaha par replace kar rahe hai
        item.restaurant_id = restaurant ? restaurant : null;

        // product me restaurant_id ko hata dete hai
        delete item.product.restaurant_id;
      }
    }

    return res.json({
      status: true,
      message: "Cart fetched successfully",
      data: cartItems
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

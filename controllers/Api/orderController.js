const { CASHFREE_CONFIG } = require("../../config/cashFreeConfig");
const { Op, Sequelize } = require("sequelize");

const { Cart, ProductVariant, RestaurantOffer, Order, OrderItem, Address } = require("../../models");

// Order History API
const getOrderHistory = async (req, res) => {
  try {
    const { user_id } = req.body; // ya req.body se le sakte ho

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "user_id is required"
      });
    }

    // ✅ Pending orders
    const pendingOrders = await Order.findAll({
      where: { 
        user_id,
        order_status: "pending"   // ya tumhare db me jo status hai uske hisaab se
      },
      order: [["created_at", "DESC"]]
    });

    // ✅ Delivered orders
    const deliveredOrders = await Order.findAll({
      where: { 
        user_id,
        order_status: "delivered" // ya "completed"
      },
      order: [["created_at", "DESC"]]
    });

    return res.json({
      status: true,
      message: "Order history fetched successfully",
      pendingOrders,
      deliveredOrders
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
};



const initiateCheckout = async (req, res) => {
  try {
    const { 
      user_id,
      restaurant_id,              // array ya single id
      coupon_discount_amount,
      charges,
      payment_status,
      payable_amount,
      amount_as_per_restaurant,   // [{ restaurant_id: 1, amount: 200 }, { restaurant_id: 2, amount: 300 }]
      payment_order_id,
      paymode
    } = req.body;

    // 1️⃣ Validate request
    if (!user_id || !Array.isArray(amount_as_per_restaurant) || amount_as_per_restaurant.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields or amount_as_per_restaurant is empty"
      });
    }

    // 2️⃣ Check if cart exists for each restaurant
    for (let item of amount_as_per_restaurant) {
      const cartExists = await Cart.findOne({
        where: { user_id, restaurant_id: item.restaurant_id }
      });

      if (!cartExists) {
        return res.status(400).json({
          status: false,
          message: `No cart found for restaurant_id ${item.restaurant_id}`
        });
      }
    }

    // 3️⃣ Insert order rows (ek-ek restaurant ke liye)
    const createdOrders = [];
    for (let item of amount_as_per_restaurant) {
      const newOrder = await Order.create({
        user_id,
        restaurant_id: item.restaurant_id,
        coupon_discount_amount,
        charges,
        payment_status,
        payable_amount,
        amount: item.amount,         // per restaurant amount
        cf_order_id: payment_order_id, // mapping
        paymode
      });

       createdOrders.push(newOrder);

      // 4️⃣ Order banne ke baad cart clear karo for that restaurant & user
      await Cart.destroy({
        where: { user_id, restaurant_id: item.restaurant_id }
      });
    }
    return res.json({
      status: true,
      message: "Orders created successfully",
      orders: createdOrders
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: err.message });
  }
};


const createSession = async (req, res) => {
  try {
    const { amount, customer_id, customer_email, customer_phone } = req.body;

    // 🔹 Order ID generate कर रहे हैं
    const orderId = "order_" + Date.now();

    const response = await fetch(`${CASHFREE_CONFIG.BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_CONFIG.APP_ID,
        "x-client-secret": CASHFREE_CONFIG.SECRET_KEY,
        "x-api-version": CASHFREE_CONFIG.API_VERSION,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount || 100.0,
        order_currency: "INR",
        customer_details: {
          customer_id: customer_id || "cust_001",
          customer_email: customer_email || "test@example.com",
          customer_phone: customer_phone || "9999999999",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    // 🔹 Response सीधे return कर रहे हैं, कहीं save नहीं हो रहा
    return res.status(200).json({
      status: true,
      message: "Payment session created successfully",
      pg_res: {
        cf_order_id: data.cf_order_id,
        order_id: data.order_id,
        order_status: data.order_status,
        payment_session_id: data.payment_session_id,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};


// 🚀 Step 2: Payment Success Callback (Webhook or frontend confirm)
const paymentSuccess = async (req, res) => {
  try {
    const { cf_order_id, order_id, user_id, restaurant_id, product_id, quantity, address_id, amount } = req.body;

    // 1️⃣ Save order
    const order = await Order.create({
      order_id,
      cf_order_id,
      payment_session_id: req.body.payment_session_id,
      user_id,
      restaurant_id,
      address_id,
      amount,
      order_status: "PLACED",
      payment_status: "SUCCESS",
    });

    // 2️⃣ Save order item
    await OrderItem.create({
      order_id: order.order_id,
      product_id,
      quantity,
      price: amount,
    });

    // 3️⃣ (Optional) Clear cart
    await Cart.destroy({ where: { user_id, restaurant_id, product_id } });

    res.json({
      status: true,
      message: "Order created successfully",
      order,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { initiateCheckout, paymentSuccess,createSession,getOrderHistory };

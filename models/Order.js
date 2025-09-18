const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("Order", {
  order_id: { type: DataTypes.STRING, allowNull: true },
  cf_order_id: { type: DataTypes.STRING },
  payment_session_id: { type: DataTypes.STRING },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  restaurant_id: { type: DataTypes.STRING, allowNull: false }, // JSON string for multiple restaurants
  amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  paymode: { type: DataTypes.ENUM("cod", "online"), allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: "INR" },
  order_status: { type: DataTypes.ENUM("PENDING", "ON THE WAY","DELIVERED"), allowNull: false, defaultValue: "PENDING" },
  payment_status: { type: DataTypes.ENUM("PENDING", "SUCCESS","REJECT"), allowNull: false, defaultValue: "PENDING" },
  charges: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  coupon_discount_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
}, {
  tableName: "orders",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

module.exports = Order;

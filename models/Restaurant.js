// models/Restaurant.js
module.exports = (sequelize, DataTypes) => {
  const Restaurant = sequelize.define("Restaurant", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
	restaurant_title: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING },
	   latitude: { type: DataTypes.DECIMAL },   // ✅ fixed
    longitude: { type: DataTypes.DECIMAL },  // ✅ fixed
	   rating: { type: DataTypes.DECIMAL },  // ✅ fixed
	  image: { type: DataTypes.STRING },
	   video: { type: DataTypes.STRING },
	  delivery_time: { type: DataTypes.STRING },
    distance: { type: DataTypes.STRING },
   	veg_type: { type: DataTypes.STRING },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
  }, {
    tableName: "restaurants",
    timestamps: true,
	createdAt: "created_at",     // Laravel ka column name
  	updatedAt: "updated_at",     // Laravel ka column name
  });

  return Restaurant;
};

module.exports = (sequelize, DataTypes) => {
  const RestaurantTiming = sequelize.define("RestaurantTiming", {
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    day_of_week: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    open_time: DataTypes.TIME,
    close_time: DataTypes.TIME,
  }, {
    tableName: "restaurant_timings",
    timestamps: true,
	   createdAt: "created_at",     // Laravel ka column name
  updatedAt: "updated_at",     // Laravel ka column name
  });

  return RestaurantTiming;
};

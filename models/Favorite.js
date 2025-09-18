module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    "Favorite",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      restaurant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "favorites",   // ✅ Table ka naam
      timestamps: true,         // ✅ createdAt & updatedAt enable
      createdAt: "created_at",  // ✅ Laravel convention
      updatedAt: "updated_at",
    }
  );

  return Favorite;
};

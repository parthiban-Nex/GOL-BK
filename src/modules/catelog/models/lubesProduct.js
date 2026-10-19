export default function LubesProductData(sequelize, DataTypes) {
  const LubesProduct = sequelize.define(
    'lubes_products',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'LUBRICANTS',
        comment: 'LUBRICANTS, BRAKE_FLUID, COOLANT',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      grade: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      colour: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      pack: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ratio: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      partNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mrp: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sellingPriceWithGst: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      sellingPriceWithoutGst: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      bronzePoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      silverPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      goldPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      platinumPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'ACTIVE',
      },
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return LubesProduct;
}

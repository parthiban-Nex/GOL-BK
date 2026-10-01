export default function Carts(sequelize, DataTypes) {
    const Cart = sequelize.define(
      "carts",
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        product_brand: {
          type: DataTypes.STRING(100), 
          allowNull: true,
        },
        part_number: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notNull: { msg: "Part Number is required" },
            notEmpty: { msg: "Part Number cannot be empty" },
          },
        },
        part_desc: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        part_mrp: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        qty: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 1,
          comment: "1=added, 2=order_placed",
        },
        list_price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        tax: {
          type: DataTypes.DECIMAL(5, 2), 
          allowNull: true,
        },
        outletCode: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
      },
      {
        timestamps: true,
      }
    );
  
    return Cart; 
  }
  
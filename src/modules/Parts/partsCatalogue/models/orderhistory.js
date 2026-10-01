export default function OrderHistories(sequelize, DataTypes) {
    const OrderHistories = sequelize.define(
      "order_histories",
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
        order_number: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        customer_account: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        customer_code: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        no_of_lines: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        online_payment: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        order_created_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        order_reference_number: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        order_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        order_value: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },
        payment_reference_number: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        payment_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        warranty_debit: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        items: {
          type: DataTypes.JSON, 
          allowNull: false,
          comment: "Stores items like [{ qty, part_no, unit_price, tax_percent, total_price }]",
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
  
    return OrderHistories;
  }
  
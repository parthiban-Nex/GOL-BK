export default function financePurchaseItemdatas(sequelize, DataTypes) {
  const FinancePurchaseItem = sequelize.define(
    'finance_purchase_item',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      purchaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      partId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      hsnCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(250),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Item name is required',
          },
        },
      },
      qty: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1,
      },
      rate: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'finance_purchase_items',
      timestamps: true,
    }
  );

  return FinancePurchaseItem;
}

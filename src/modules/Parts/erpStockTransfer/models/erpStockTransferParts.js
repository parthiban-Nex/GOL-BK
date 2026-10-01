export default function erpstocktransferpartdata(sequelize, DataTypes) {
  const ErpStockTransferPart = sequelize.define('erp_stock_transfer_parts', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    erp_stock_transfer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    partsCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    supInvQty: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    receivedQty: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    rate: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    cost: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
        cgst: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    sgst: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    igst: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    hsnCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    grn_parts_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'erp_stock_transfer_parts',
    timestamps: true,
    underscored: false,
  });

  return ErpStockTransferPart;
  }
  
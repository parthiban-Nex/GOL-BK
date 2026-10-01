export default function stocktransferoraclepartdata(sequelize, DataTypes) {
  const StockTransferOraclePart = sequelize.define('stock_transfer_oracle_parts', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    stock_transfer_oracle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    transactionUOM: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    transactionQty: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    lotNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lotDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hsnCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    listPrice: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    unitCost: {
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
    totalValue: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    grn_parts_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'stock_transfer_oracle_parts',
    timestamps: true,
    underscored: false,
  });

  return StockTransferOraclePart;
  }
  
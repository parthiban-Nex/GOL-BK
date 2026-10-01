export default function erpstocktransferapilogdata(sequelize, DataTypes) {
const ErpStockTransferApiLog = sequelize.define('ErpStockTransferApiLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    data: {
      type: DataTypes.TEXT('long'), 
      allowNull: false,
    },   
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'erp_stock_transfer_api_logs',
    timestamps: true, 
    underscored: true,
  });

  return ErpStockTransferApiLog;
  }
  
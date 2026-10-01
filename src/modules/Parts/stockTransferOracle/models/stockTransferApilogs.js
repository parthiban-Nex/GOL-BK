export default function stocktransferapilogdata(sequelize, DataTypes) {
const StockTransferApiLog = sequelize.define('StockTransferApiLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reg_no: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    data: {
      type: DataTypes.TEXT('long'), // corresponds to MySQL longtext
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING(25),
      allowNull: true,
    },
   
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'stock_transfer_api_logs',
    timestamps: true, // automatically handled 'createdAt' and 'updatedAt' fields
    underscored: true,
  });

  return StockTransferApiLog;
  }
  
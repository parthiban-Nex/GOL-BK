export default function NegAdjStocklogdatas(sequelize, DataTypes) {
    const NegAdjStockLog = sequelize.define(
      'Neg_Adj_Stock_Log',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
  
        stock_adj_part_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
  
        stock_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
  
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        timestamps: true,
      }
    );
  
    return NegAdjStockLog;
  }
  
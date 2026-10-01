export default function StocktransferlogDatas(sequelize, DataTypes) {
    const Stocklog = sequelize.define(
      'stocktransferlog',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
  
        stocktransfer_part_id: {
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
  
    return Stocklog;
  }
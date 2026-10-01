export default function CountersaleStocklogdatas(sequelize, DataTypes) {
    const Stocklog = sequelize.define(
      'countersalelog',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
  
        countersale_part_id: {
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
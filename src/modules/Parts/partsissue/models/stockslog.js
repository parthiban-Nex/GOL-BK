export default function Stocklogdatas(sequelize, DataTypes) {
  const Stocklog = sequelize.define(
    'stocks_log',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      issue_id: {
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

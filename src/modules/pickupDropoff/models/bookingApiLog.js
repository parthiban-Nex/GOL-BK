export default function bookingApiLogData(sequelize, DataTypes) {
  const BookingApiLog = sequelize.define(
    'BookingApiLog',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      data: {
        type: DataTypes.TEXT('long'),
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
    },
    {
      tableName: 'booking_api_logs',
      timestamps: true,
      underscored: true,
    }
  );

  return BookingApiLog;
}

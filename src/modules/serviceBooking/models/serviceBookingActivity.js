export default function serviceBookingActivityDatas(sequelize, DataTypes) {
  return sequelize.define(
    'servicebookingactivity',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      serviceBookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      followupDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      serviceProvider: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      saleDetails: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      correctContactNumber: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      createEstimate: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      estimateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      jobCardId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'servicebookingactivities',
      timestamps: true,
    }
  );
}

export default function partsEstimatedatas(sequelize, DataTypes) {
  const PartsEstimate = sequelize.define(
    'parts_estimate',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      serviceEstimateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      partId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      partNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      partDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hsnCode: {
        type: DataTypes.STRING(25),
        allowNull: true,
      },
      requestedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rate: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      additionalMargin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      discountAmount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sgst: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cgst: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      igst: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      partTotal: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      serviceRecommendation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fitId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      approveStatus: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      approveDatetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return PartsEstimate;
}

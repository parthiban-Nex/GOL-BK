export default function oslLaborEstimatedatas(sequelize, DataTypes) {
  const OslLaborEstimate = sequelize.define(
    'osl_labor_estimate',
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
      laborId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      laborCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      laborDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sacCode: {
        type: DataTypes.STRING(25),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      additionalMargin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      singleAmount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rate: {
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
      laborTotal: {
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
      osl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendorId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      marginPercentage: {
        type: DataTypes.STRING,
        allowNull: true,
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

  return OslLaborEstimate;
}

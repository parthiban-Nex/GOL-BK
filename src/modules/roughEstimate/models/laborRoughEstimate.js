export default function laborRoughEstimateDatas(sequelize, DataTypes) {
  const LaborRoughEstimate = sequelize.define(
    'labor_rough_estimate',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roughEstimateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      laborDescription: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tax: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      laborTotal: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      showOrder: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return LaborRoughEstimate;
}

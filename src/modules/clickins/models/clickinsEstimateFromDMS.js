export default function ClicksEstimateFromDMS(sequelize, DataTypes) {
  const ClicksEstimateFromDMS = sequelize.define(
    "vrm_trans_clicks_etimate_from_dms",
    {
      ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      VISIT_ID: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      ESTIMATE: {
        type: DataTypes.STRING(5000),
        allowNull: false,
      },
      CREATED_BY: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "vrm_trans_clicks_etimate_from_dms",
      timestamps: false, // because you're managing CREATED_DATE & UPDATED_DATE manually
    }
  );

  return ClicksEstimateFromDMS
}
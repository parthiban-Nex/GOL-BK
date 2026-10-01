export default function ClickinStatus(sequelize, DataTypes) {
  const ClickinStatus = sequelize.define(
    'vrm_trans_clickins_status',
    {
      VISIT_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      CLICK_INS_STATUS: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
    tableName: 'vrm_trans_clickins_status',
    timestamps: false
  });

  return ClickinStatus;
}

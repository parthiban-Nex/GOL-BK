export default function ClickinsPartsSendToDMS(sequelize, DataTypes) {
  const ClickinsPartsSendToDMS = sequelize.define(
    'vrm_trans_clickins_parts_sendto_dms',
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
      REPAIR_TYPE: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      REPAIRS: {
        type: DataTypes.STRING(200),
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
      tableName: "vrm_trans_clickins_parts_sendto_dms",
      timestamps: false, // since dates are manually handled
    }
  );

  return ClickinsPartsSendToDMS;
}

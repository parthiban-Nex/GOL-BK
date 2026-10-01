export default function SavePDCChecklist(sequelize, DataTypes) {
  const PreDeliveryChecklist = sequelize.define(
    "PreDeliveryChecklist",
    {
      CUSTOMER_VISIT_PDC_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      VISIT_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      VEHICLE_PDC_VER: {
        type: DataTypes.DECIMAL(3,1),
        allowNull: true
      },
      VEHICLE_PDC_CODE: {
        type: DataTypes.STRING(16),
        allowNull: false
      },
      VEHICLE_PDC_REMARKS: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      AVAILABLE: {
        type: DataTypes.TINYINT,
        allowNull: false
      }
    },
    {
      tableName: "vrm_trans_customer_visit_predelivery_checklist",
      timestamps: false,
      underscored: false
    }
  );

  return PreDeliveryChecklist;
};

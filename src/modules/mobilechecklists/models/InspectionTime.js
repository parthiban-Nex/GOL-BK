export default function InspectionTime(sequelize, DataTypes) {
  const InspectionTime = sequelize.define(
    "InspectionTime",
    {
      ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      VISIT_ID: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      START_TIME: {
        type: DataTypes.STRING(16),
        allowNull: true
      },
      END_TIME: {
        type: DataTypes.STRING(16),
        allowNull: true
      },
      TIME_SPENT: {
        type: DataTypes.STRING(16),
        allowNull: true
      },
      ACTIVITY_NAME: {
        type: DataTypes.STRING(32),
        allowNull: true
      }
    },
    {
      tableName: "vrm_trans_inspection_time",
      timestamps: false
    }
  );

  return InspectionTime;
};

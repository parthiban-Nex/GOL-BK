export default function paramAlertScheduleDatas(sequelize, DataTypes) {
  const ParamAlertSchedule = sequelize.define(
    'vrm_master_param_alert_schedule',
    {
      UNIQUE_PARAM_PRIORITY_ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      INSPECTION_TYPE: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CHECKLIST_TYPE_CODE: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CHECKLIST_VERSION: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
      PARAM_CODE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      PARAM_RATING: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      LIFE_REMAINING: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ACTIVE: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'CREATED_DATE',
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_DATE',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return ParamAlertSchedule;
}

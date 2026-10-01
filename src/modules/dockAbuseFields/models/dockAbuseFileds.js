export default function dockAbuseFieldDatas(sequelize, DataTypes) {
  const DockAbuseField = sequelize.define(
    'vrm_master_dock_abuse_field',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      LABEL: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      INPUT_TYPE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      INPUT_VALUES: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      IS_MANDATORY: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_DATE',
      },
      STATUS: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return DockAbuseField;
}

export default function clickInPartNameDatas(sequelize, DataTypes) {
  const ClickInPartNames = sequelize.define(
    'vrm_master_clickin_part_names',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      CLICKINS_NAME: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      PANEL_NAME: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      CREATED_BY: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'UPDATED_DATE',
      },
      STATUS: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return ClickInPartNames;
}

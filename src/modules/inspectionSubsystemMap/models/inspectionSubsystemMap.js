export default function inspectionSubsystemMapDatas(sequelize, DataTypes) {
  const InspectionSubsystemMap = sequelize.define(
    'vrm_master_inspection_subsystem_map',
    {
      SUBSYSTEM_ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      CHECK_LIST_TYPE_CODE: {
        type: DataTypes.STRING(28),
        allowNull: false,
      },
      SUBSYSTEM_CODE: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      SUBSYSTEM_NAME: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      ACTIVE: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      CREATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      CREATED_TIME: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'CREATED_TIME',
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      UPDATED_TIME: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_TIME',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_TIME',
      updatedAt: 'UPDATED_TIME',
    }
  );

  return InspectionSubsystemMap;
}

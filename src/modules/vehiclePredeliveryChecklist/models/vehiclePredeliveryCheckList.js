export default function CheckListDatas(sequelize, DataTypes) {
  const VehiclePredeliveryCheckList = sequelize.define(
    'vrm_master_vehicle_predelivery_checklist',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      VEHICLE_PDC_CODE: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: '',
        primaryKey: true,
        field: 'VEHICLE_PDC_CODE',
      },
      VEHICLE_PDC_DESC: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'VEHICLE_PDC_DESC',
      },
      VEHICLE_PDC_VER: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: false,
        defaultValue: 0.0,
        primaryKey: true,
        field: 'VEHICLE_PDC_VER',
      },
      VEHICLE_TYPE: {
        type: DataTypes.STRING(16),
        allowNull: true,
        field: 'VEHICLE_TYPE',
      },
      ACTIVE: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'ACTIVE',
      },
      CREATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
        field: 'CREATED_BY',
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'CREATED_DATE',
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
        field: 'UPDATED_BY',
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

  return VehiclePredeliveryCheckList;
}

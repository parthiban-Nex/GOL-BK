export default function InventoryCheckListDatas(sequelize, DataTypes) {
  const InventoryCheckList = sequelize.define(
    'vrm_master_inventory_checklist',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      INVENTORY_CODE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      INVENTORY_DESC: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      INVENTORY_VER: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      INVENTORY_TYPE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      VEHICLE_TYPE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      SORT_ORDER: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ACTIVE: {
        type: DataTypes.INTEGER,
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
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return InventoryCheckList;
}

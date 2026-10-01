export default function SaveInventoryCheckListDatas(sequelize, DataTypes) {
  const SaveInventoryCheckList = sequelize.define(
    'vrm_trans_customer_visit_inv_checklist',
    {
      customer_visit_inventory_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      visit_id: {
        type: DataTypes.STRING(45),
      },
      vehicle_inv_ver: {
        type: DataTypes.STRING(128),
      },
      inventory_code: {
        type: DataTypes.STRING(64),
      },
      inventory_type: {
        type: DataTypes.STRING(64),
      },
      inventory_condition: {
        type: DataTypes.STRING(200),
      },
      remarks: {
        type: DataTypes.TEXT,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'created_date',
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return SaveInventoryCheckList;
}

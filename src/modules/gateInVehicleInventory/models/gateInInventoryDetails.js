export default function inventoryGateinVehicles(sequelize, DataTypes) {
  const inventortVehicleGatein = sequelize.define(
    'vrm_trans_customer_visit_gi_inv_checklist',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,

        primaryKey: true,
        autoIncrement: true,
      },
      visit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vehicle_inv_ver: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: false,
      },
      inventory_code: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      inventory_type: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      inventory_condition: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return inventortVehicleGatein;
}

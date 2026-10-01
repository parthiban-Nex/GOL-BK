// Maps to the EXISTING `driver_masters` table (imported from UAT).
// Column names match our usage; NOTE timestamps are camelCase (createdAt/updatedAt),
// so do NOT enable `underscored: true` here (that would look for created_at/updated_at).
// Backup of the previous `driver_master` (singular) model: D:\Project flow\backups\driverMaster.original-driver_master-table.js
export default function driverMasterData(sequelize, DataTypes) {
  const DriverMaster = sequelize.define(
    'DriverMaster',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ecode: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(35),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(35),
        allowNull: true,
      },
      mobile_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'driver_masters',
      timestamps: true, // table has createdAt / updatedAt (camelCase)
    }
  );

  return DriverMaster;
}

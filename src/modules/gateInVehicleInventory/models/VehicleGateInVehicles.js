export default function VehicleGatein(sequelize, DataTypes) {
  const VehicleGatein = sequelize.define(
    'vrm_trans_inventory_gatein_vehicles',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      VISIT_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      NAME: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      CONTENT: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      CREATED_BY: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(50),
        allowNull : false
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
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return VehicleGatein;
}

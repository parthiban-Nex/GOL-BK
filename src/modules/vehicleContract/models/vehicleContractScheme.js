export default function vehicleContractSchemeDatas(sequelize, DataTypes) {
  const VehicleContractScheme = sequelize.define(
    'vehicle_contract_scheme',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_contract_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'vehicle_contracts',
          key: 'id'
        }
      },
      scheme_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'schemes',
          key: 'id'
        }
      },
      item_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      scheme_labor_parts_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      labor_parts_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      scheme_labor_parts_code: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      balance_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );
  return VehicleContractScheme;
}
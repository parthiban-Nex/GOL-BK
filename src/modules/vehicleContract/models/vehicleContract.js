export default function vehicleContractDatas(sequelize, DataTypes) {
  const VehicleContract = sequelize.define(
    'vehicle_contract',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      doc_no: {
        type: DataTypes.STRING(30),
        allowNull: true,
        default: ""
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      customer_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vehicle_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      scheme_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'schemes',
          key: 'id'
        }
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      cgst: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      sgst: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      igst: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      total_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        default: null
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );
  return VehicleContract;
}
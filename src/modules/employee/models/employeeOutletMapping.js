export default function employeeoutletmapdatas(sequelize, DataTypes) {
  const employeeOutletMap = sequelize.define(
    'employee_outlet_map',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      emp_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id',
        },
      },

      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'companies',
        //   key: 'id',
        // },
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );

  return employeeOutletMap;
}

export default function employeeroledatas(sequelize, DataTypes) {
  const employeeRole = sequelize.define(
    'employeerole',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      employeeRole: {
        type: DataTypes.STRING(250),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Employee Role is required',
          },
          notEmpty: {
            msg: 'Employee Role is not empty',
          },
        },
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      updatedBy: {
        type: DataTypes.INTEGER,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return employeeRole;
}

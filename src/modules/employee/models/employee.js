export default function employeedatas(sequelize, DataTypes) {
  const employee = sequelize.define(
    'employee',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      outletId: {
        type: DataTypes.STRING(250),
        allowNull: false,
        references: {
          model: 'outlets',
          key: 'id',
        },
      },

      employeeRoleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'employeeroles',
          key: 'id',
        },
      },

      employeeName: {
        type: DataTypes.STRING(250),
        allowNull: false,

        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Employee Name is required',
          },
          notEmpty: {
            msg: 'Employee Name is not empty',
          },
        },
      },

      employeeCode: {
        type: DataTypes.STRING(25),
        allowNull: false,
        // unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Employee Code is required',
          },
          notEmpty: {
            msg: 'Employee Code is not empty',
          },
        },
      },

      mobileNumber: {
        type: DataTypes.BIGINT,
        // allowNull: false,
        allowNull: true,
        // unique: true,
        validate: {
          // notNull: {
          //   msg: 'Please enter a valid number',
          // },
          len: {
            args: [10, 10],
            msg: 'Min length of the Mobile Number is 10',
          },
        },
      },

      email: {
        type: DataTypes.STRING,

        // allowNull: false,
        allowNull: true,

        unique: true,
        isEmail: true,
        validate: {

          // notNull: {
          //   msg: 'Email address is required',
          // },
          
          isEmail: {
            msg: 'Invalid email',
          },
        },
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },

      reports: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      updatedBy: {
        type: DataTypes.INTEGER,
      },
      dms_emp_id:{
        type: DataTypes.INTEGER,
       allowNull: true,
      }
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return employee;
}

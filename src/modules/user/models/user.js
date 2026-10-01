export default function userdatas(sequelize, DataTypes) {
  const User = sequelize.define(
    'user',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Password is required',
          },
        },
      },
      mobile_password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Mobile Password is required',
          },
        },
      },
      user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'EmployeeCode is required',
          },
        },
      },
      token: {
        type: DataTypes.TEXT,
      },
      fcm_tocken: {
        type: DataTypes.TEXT,
      },
      mobile_token: {
        type: DataTypes.TEXT,
      },
      appversion: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      phonemodel: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      phonemanufacture: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      version_code: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      customer_account_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      sdk_version: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      networktype: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      referesh_required: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      announcement: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      mobile_token_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id',
        },
      },
      wrong_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      last_login: {
        type: DataTypes.DATE
      },
      user_pin_hash: {
        type: DataTypes.STRING(255),
        defaultValue: 0
      },
      password_changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      is_first_login: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      user_type: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      part_gpt_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    },

  );

  return User;
}

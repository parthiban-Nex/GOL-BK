export default function dsaagentdatas(sequelize, DataTypes) {
  const DSAAgent = sequelize.define(
    'dsaagent',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      dsaCode: {
        type: DataTypes.STRING(25),
        allowNull: false,
        unique: true,
      },
      dsaName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'DSAName is required',
          },
        },
      },
      address1: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Address1 is required',
          },
          notEmpty: {
            msg: 'Address1 is not Empty',
          },
        },
      },
      address2: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Address2 is required',
          },
          notEmpty: {
            msg: 'Address2 is not Empty',
          },
        },
      },
      city: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'city is required',
          },
          notEmpty: {
            msg: 'city is not Empty',
          },
        },
      },
      pincode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        notEmpty: false,

        validate: {
          notNull: {
            msg: 'Please enter a pincode',
          },
          len: {
            args: [6, 6],
            msg: 'Min length of the pincode is 6',
          },
          notEmpty: {
            msg: 'pincode is not Empty',
          },
        },
      },
      state: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'state is required',
          },
          notEmpty: {
            msg: 'state is not Empty',
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        isEmail: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Email is required',
          },
          isEmail: {
            msg: 'Invalid email',
          },
          notEmpty: {
            msg: 'Email is not Empty',
          },
        },
      },

      whatsapp: {
        type: DataTypes.STRING(15),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Please enter a valid number',
          },
          len: {
            args: [10, 10],
            msg: 'Min length of the phone number is 10',
          },
          notEmpty: {
            msg: 'phoneNumber is not Empty',
          },
        },
      },

      mobileNumber: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Please enter a valid number',
          },
          len: {
            args: [10, 10],
            msg: 'Min length of the phone number is 10',
          },
          notEmpty: {
            msg: 'phoneNumber is not Empty',
          },
        },
      },
      alternativeMobileNumber: {
        type: DataTypes.STRING(15),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Please enter a valid number',
          },
          len: {
            args: [10, 10],
            msg: 'Min length of the phone number is 10',
          },
          notEmpty: {
            msg: 'phoneNumber is not Empty',
          },
        },
      },

      panNo: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
      },

      bankName: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },

      branchName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      accountNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      ifscCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      bankCity: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'city is required',
          },
          notEmpty: {
            msg: 'city is not Empty',
          },
        },
      },
      dsaManagedBy: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },

      sourceOfTheDSA: {
        type: DataTypes.STRING(50),
        allowNull: false,
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

  return DSAAgent;
}

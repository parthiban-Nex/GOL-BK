export default function vendordatas(sequelize, DataTypes) {
  const Vendor = sequelize.define(
    'vendor',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      // oracle_vendor_number: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true,
      // },
      oracle_vendor_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      
      vendor_site_code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      vendorCode: {
        // type: DataTypes.STRING(15),
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'vendor code is required',
          },
          notEmpty: {
            msg: 'vendor code is not empty',
          },
        },
      },
      vendorName: {
        type: DataTypes.STRING(250),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'vendor name is required',
          },
          notEmpty: {
            msg: 'vendor name is not empty',
          },
        },
      },
      gstin: {
        type: DataTypes.STRING(15),
      },
      panNumber: {
        type: DataTypes.STRING(15),
      },
      address1: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'address1 is required',
          },
          notEmpty: {
            msg: 'address1 is not empty',
          },
        },
      },
      address2: {
        type: DataTypes.TEXT,
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'address2 is required',
        //   },
        //   notEmpty: {
        //     msg: 'address2 is not empty',
        //   },
        // },
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'state is required',
          },
          notEmpty: {
            msg: 'state is not empty',
          },
        },
      },
      city: {
        type: DataTypes.STRING(25),
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'city is required',
        //   },
        //   notEmpty: {
        //     msg: 'city is not empty',
        //   },
        // },
        allowNull: true,
      },
      areaName: {
        type: DataTypes.STRING(250),
        allowNull: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'areaName is required',
        //   },
        //   notEmpty: {
        //     msg: 'areaName is not empty',
        //   },
        // },
      },
      pincode: {
        type: DataTypes.INTEGER,
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'pincode is required',
        //   },
        //   notEmpty: {
        //     msg: 'pincode is not empty',
        //   },
        // },
        allowNull: true,
      },
      mobileNumber: {
        // type: DataTypes.BIGINT,
        type: DataTypes.STRING(50),
        // allowNull: false,
        // notEmpty: true,
        // unique: true,
        // validate: {
        //   notNull: {
        //     msg: 'Please enter a valid number',
        //   },
        //   len: {
        //     args: [10, 10],
        //     msg: 'Min length of the mobile number is 10',
        //   },
        //   notEmpty: {
        //     msg: 'mobileNumber is not empty',
        //   },
        // },
        allowNull: true,
      },
      contactPerson: {
        type: DataTypes.STRING(150),
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'contactPerson is required',
        //   },
        //   notEmpty: {
        //     msg: 'contactPerson is not empty',
        //   },
        // },
        allowNull: true,
      },
      contactPersonMobileNo: {
        // type: DataTypes.BIGINT,
        type: DataTypes.STRING,

        // allowNull: false,
        // notEmpty: true,
        allowNull: true,

        // unique: true,
        // validate: {
        //   // notNull: {
        //   //   msg: 'Please enter a valid number',
        //   // },
        //   len: {
        //     args: [10, 10],
        //     msg: 'Min length of the mobile number is 10',
        //   },
        //   // notEmpty: {
        //   //   msg: 'contactPerson mobile number is not empty',
        //   // },
        // },
      },
      vendorType: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'vendorType is required',
          },
          notEmpty: {
            msg: 'vendorType is not empty',
          },
        },
      },
      marginPercentage: {
        type: DataTypes.DOUBLE,
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'marginPercentage is required',
        //   },
        //   notEmpty: {
        //     msg: 'marginPercentage is not empty',
        //   },
        // },
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },
      isWarehouse: {
        type: DataTypes.TINYINT,
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
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return Vendor;
}

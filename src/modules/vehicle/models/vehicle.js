export default function vehicleDatas(sequelize, DataTypes) {
  const Vehicle = sequelize.define(
    'vehicle',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      registrationNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
        // allowNull: false,
        // notEmpty: true,
        // unique: true,
        // validate: {
        //   notNull: {
        //     msg: 'registrationNumber is required',
        //   },
        //   notEmpty: {
        //     msg: 'registrationNumber is not Empty',
        //   },
        // },
      },
      makeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'makes',
          key: 'id',
        },
      },
      modelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'models',
          key: 'id',
        },
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'varients',
          key: 'id',
        },
      },
      fuelType: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // validate: {
        //   notNull: {
        //     msg: 'fuelType is required',
        //   },
        //   notEmpty: {
        //     msg: 'fuelType is not Empty',
        //   },
        // },
      },
      odometer: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'odometer is required',
        //   },
        //   notEmpty: {
        //     msg: 'odometer is not Empty',
        //   },
        // },
      },
      chassisNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        // unique: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'chassisNumber is required',
        //   },
        //   notEmpty: {
        //     msg: 'chassisNumber is not Empty',
        //   },
        // },
      },
      engineNumber: {
        type: DataTypes.STRING(50),
        allowNull: true,
        // unique: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'engineNumber is required',
        //   },
        //   notEmpty: {
        //     msg: 'engineNumber is not Empty',
        //   },
        // },
      },
      color: {
        type: DataTypes.STRING(20),
        allowNull: true
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'color is required',
        //   },
        //   notEmpty: {
        //     msg: 'color is not Empty',
        //   },
        // },
      },
      insuranceName: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      insuranceProviderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      insuranceLocation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      insuranceAreaName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      insurancePincode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      insuranceCity: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      insuranceClaimNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      insuranceGstinNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      insuranceExpDate: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      permitDue: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      taxDue: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      contranceFlag: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      hypothecationAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        // allowNull: false,
        allowNull: true
      },
      warrantyStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        // allowNull: false,
        allowNull: true
      },
      driverMobileNumber: {
        type: DataTypes.STRING(20),
        defaultValue: null,
        allowNull: true,
      },
      driverName: {
        type: DataTypes.STRING(150),
        defaultValue: null,
        allowNull: true,
      },

      stageNorms: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      axle: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      application: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      nextDueDateFC: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      // nextDueDateFC: {
      //   type: DataTypes.DATE,  //fc
      //   allowNull: true,
      // },

      engineOilCapacity: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateOfSale: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateOfRegistration: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      membership_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      rsa_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      rsa_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      certificate_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      rsa_flag: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      rsa_transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      vehicle_used_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      contact_number: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      pincode: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      last_service_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      last_service_km: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      motor_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      mcu: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      battery_no_1: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      battery_no_2: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      charger_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      imei: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      colour_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      insurance_policy_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      manufacturingYear: {
        type: DataTypes.STRING(45),
        allowNull: true,
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

  return Vehicle;
}

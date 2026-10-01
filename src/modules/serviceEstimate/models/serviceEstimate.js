export default function servicEstimateDatas(sequelize, DataTypes) {
  const ServicEstimate = sequelize.define(
    'service_estimate',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      outletId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'outlets',
          key: 'id',
        },
      },
      serviceEstimateNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: 'serviceBookingNumber is required',
          },
        },
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 0,
        allowNull: false,
      },
      gstStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      estimateApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      estimateApprovedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      estimateApprovedByName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      estimateApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      registrationNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      vehicleMakeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vehicleModelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerName: {
        type: DataTypes.STRING(500),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'customerName is required',
          },
          notEmpty: {
            msg: 'customerName is not Empty',
          },
        },
      },
      customerMobileNumber: {
        type: DataTypes.STRING(500),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'customerMobileNumber is required',
          },
          notEmpty: {
            msg: 'customerMobileNumber is not Empty',
          },
        },
      },
      customerAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerState: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      customerCity: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      customerPincode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      customerVoice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      serviceEngineerRemarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      sourceType: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      odometer: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      driverMobileNumber: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      driverName: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      jobType: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      serviceType: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      repairType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      expectedWorkCompletedDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      serviceBookingId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      serviceBookingNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Gate IN-Gate OUT report — vehicle gate-in datetime 
      gatein_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      inventoryReportLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdby: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return ServicEstimate;
}

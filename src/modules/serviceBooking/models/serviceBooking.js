export default function serviceBookingDatas(sequelize, DataTypes) {
  const ServicBooking = sequelize.define(
    'servicebookings',
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
      serviceBookingNumber: {
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
      registrationNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
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
      odometer: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customeId: {
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
        type: DataTypes.STRING(200),
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
        type: DataTypes.TEXT('long'),
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
      pincode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      customerStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      dmsSourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dmsSourceTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dispositionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      phoneCallNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      serviceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      appointmentDate: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      nextFollowupDate: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      scheduledStartDate: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      scheduledEndDate: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      statusFlag: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
      },
      bookingId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      b2bBookingId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pick_up_address: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      pickup_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null
      },
      dropoff_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null,
      },
      pickup_date: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'pickup_date',
      },
      pickup_time: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'pickup_time',
      },
      pickup_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dropoff_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pick_up_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      drop_off_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Gate IN-Gate OUT report source columns 
      fit_driver_pickup_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fit_driver_pickup_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fit_driver_pcikup_outlet_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fit_driver_dropoff_cus_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      drop_off_address: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      driver_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null,
      },
      service_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      payment_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      txnid: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      advance_amount: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      payment_response: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      payment_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      product: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      verified_status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      goBumpr_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      booking_track: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      coupon_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      coupon_flag: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      coupon_desc: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      coupon_amount: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
       utm_source: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      payment_response: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
       validity_till: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      final_amount: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      mytvs_coin: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      agent_discount: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      visit_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      fit_status: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      assigned_pickup_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      accident_location:{
        type: DataTypes.TEXT,
        allowNull: true
      },
      policy_number: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      insurance_company: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      policy_type: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      accident_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      accident_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      accident_location_details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return ServicBooking;
}

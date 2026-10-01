import commonLogic from '../../../shared/commonLogics.js';
export default function customerDatas(sequelize, DataTypes) {
  const Customer = sequelize.define( 
    'customer',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: DataTypes.STRING(500),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'firstName is required',
          },
          notEmpty: {
            msg: 'firstName is not Empty',
          },
        },
      },
      lastName: {
        type: DataTypes.STRING(500),
        allowNull: true,
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'lastName is required',
        //   },
        //   notEmpty: {
        //     msg: 'lastName is not Empty',
        //   },
        // },
      },
      address1: {
        type: DataTypes.TEXT,
        allowNull: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'address1 is required',
        //   },
        //   notEmpty: {
        //     msg: 'address1 is not Empty',
        //   },
        // },
      },
      address2: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'state is required',
        //   },
        //   notEmpty: {
        //     msg: 'state is not Empty',
        //   },
        // },
      },
      city: {
        type: DataTypes.STRING(45),
        allowNull: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'city is required',
        //   },
        //   notEmpty: {
        //     msg: 'city is not Empty',
        //   },
        // },
      },
      pinCode: {
        type: DataTypes.STRING(10),
        allowNull: true
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'pinCode is required',
        //   },
        //   notEmpty: {
        //     msg: 'pinCode is not Empty',
        //   },
        // },
      },
      mobileNumber: {  
        type: DataTypes.STRING(500),
        allowNull: true,
        // unique: true,
        // validate: {
        //   notNull: {
        //     msg: 'mobileNumber is required',
        //   },
        //   len: {
        //     args: [10, 10],
        //     msg: 'Min length of the Mobile Number is 10',
        //   },
        // },
        // set(value) {
        //   this.setDataValue('mobileNumber', commonLogic.encrypt(value));
        // },
        // get() {
        //   const encryptedValue = this.getDataValue('mobileNumber');
        //   return encryptedValue ? commonLogic.decrypt(encryptedValue) : null;
        // },
      },
      sourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'sources',
          key: 'id',
        },
      },
      sourceTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'servicetypes',
          key: 'id',
        },
      },
      customerCategory: {
        type: DataTypes.STRING(20),
        allowNull: true,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'customerCategory is required',
        //   },
        //   notEmpty: {
        //     msg: 'customerCategory is not Empty',
        //   },
        // },
      },
      customerType: {
        type: DataTypes.STRING(20),
        allowNull: true
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'customerType is required',
        //   },
        //   notEmpty: {
        //     msg: 'customerType is not Empty',
        //   },
        // },
      },
      billType: {
        type: DataTypes.STRING(20),
        allowNull: true
        // allowNull: false,
        // notEmpty: true,
        // validate: {
        //   notNull: {
        //     msg: 'billType is required',
        //   },
        //   notEmpty: {
        //     msg: 'billType is not Empty',
        //   },
        // },
      },
      emailId: {
        type: DataTypes.STRING,
        allowNull: true,
        // unique: true,
        // isEmail: true,
        // validate: {
        //   isEmail: {
        //     msg: 'Invalid email',
        //   },
        // },
      },
      contactPerson: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      contactPersonNumber: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      gstinNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
        unique: true,
      },
      transportName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      fleetSize: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },
      aprrovalStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        allowNull: false,
      },
      outletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'outlets',
          key: 'id',
        },
      },
      customerCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: 'customerCode is required',
          },
        },
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
      },
      aadharLink: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      rcLink: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      gstLink: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      panLink: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      aadharNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      rcNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      panNumber: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      organization: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      gender:{
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      maritalStatus:{
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateOfBirth:{
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    dateOfAnniversary:{
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    discountOptions:{
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    is_b2b:{
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    oracleCustomerCode:{
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    siteNumber:{
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
      indexes: [
        {
          unique: true,
          fields: ['customerCode'],
          name: 'idx_customer_code',
        },
      ],
    }
  );

  return Customer;
}

import { all } from "axios";

export default function outletdatas(sequelize, DataTypes) {
  const Outlet = sequelize.define(
    'outlet',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      outletCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'OutletCode is required',
          },
          notEmpty: {
            msg: 'OutletCode is not Empty',
          },
        },
      },
      outletName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'outletName is required',
          },
        },
      },
      oracleSiteCode: {
        type: DataTypes.STRING(50),
        allowNull: true,

      },
      oracleCashCustomerCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
 
      },
      oracleLocation: {
        type: DataTypes.STRING(50),
        allowNull: true,

      },
      outletSegment: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'outletSegment is required',
          },
        },
      },
      gstIn: {
        type: DataTypes.STRING(15),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'GSTIn is required',
          },
          notEmpty: {
            msg: 'GSTIn is not Empty',
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        notEmpty: false,
        
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
      
        
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
        allowNull: true,
        // notEmpty: false,
        // validate: {
        //   notNull: {
        //     msg: 'Address2 is required',
        //   },
        //   notEmpty: {
        //     msg: 'Address2 is not Empty',
        //   },
        // },
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
      contactPerson: {
        type: DataTypes.STRING(150),
      },
      contactEmail: {
        type: DataTypes.STRING(100),
      },
      contactPhoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Company Id is required',
          },
          notEmpty: {
            msg: 'Company Id is not Empty',
          },
        },
      },
      companyName: {
        type: DataTypes.STRING(50),
        allowNull: true,
  
      },
      latitude: {
        type: DataTypes.DOUBLE,
      },
      longitude: {
        type: DataTypes.DOUBLE,
      },
      bridgeId: {
        type: DataTypes.INTEGER,
      },
      googleRatingLink: {
        type: DataTypes.STRING(255),
      },
      bankName: {
        type: DataTypes.STRING(100),
        allowNull: true,

      },
      bankAccount: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      typeofAccount: {
        type: DataTypes.STRING(25),
      },
      branch: {
        type: DataTypes.STRING(50),
      },
      micrCode: {
        type: DataTypes.STRING(25),
      },
      ifscCode: {
        type: DataTypes.STRING(25),
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },
      mytvs_erp_cust_code:{
        type: DataTypes.STRING(35),
        allowNull: true,
      },
      maxPartDiscountPercentage: {
        type: DataTypes.DOUBLE,
      },
      maxLabourDiscountPercentage: {
        type: DataTypes.DOUBLE,
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

  return Outlet;
}

export default function nmsaagentdatas(sequelize, DataTypes) {
    const nmsaAgent = sequelize.define(
        'nmsa_agents',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            nmsaCode: {
                type: DataTypes.STRING(25),
                allowNull: false,
                unique: true,
            },
            nmsaName: {
                type: DataTypes.STRING(250),
                allowNull: false,
                validate: {
                    notNull: {
                        msg: 'Nmsa Name is required',
                    },
                },
            },
            address1: {
                type: DataTypes.TEXT,
                allowNull: false,
                notEmpty: false,
                validate: {
                    notNull: {
                        msg: 'Address is required',
                    },
                    notEmpty: {
                        msg: 'Address cannot be Empty',
                    },
                },
            },
            pincode: {
                type: DataTypes.INTEGER,
                allowNull: true,
                // notEmpty: false,
 
                // validate: {
                //     notNull: {
                //         msg: 'Please enter pincode',
                //     },
                //     len: {
                //         args: [6, 6],
                //         msg: 'Min length of the pincode is 6',
                //     },
                //     notEmpty: {
                //         msg: 'pincode cannot be Empty',
                //     },
                // },
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
                        msg: 'state cannot be Empty',
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
                        msg: 'city cannot be Empty',
                    },
                },
            },
            area: {
                type: DataTypes.TEXT,
                allowNull: true,
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
            fbmId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            having_car_workshop: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
            },
            zone: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            workshopCategoryId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            having_land: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
            },
            landType: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            landSize: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            invest25: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
            },
            buildWorkshop: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
            },
            supportBankLoan: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
            },
            planId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            currentLocation: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image1: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image1_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image2: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image2_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            contactedTypeId: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            contactedPersonName: {
                type: DataTypes.STRING(150),
                allowNull: true,
            },
            visitDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            visitTypeId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            workshopTypeId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            leadTypeId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            leadSourceId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            availableToolsId: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            newToolsInterested: {
                type: DataTypes.BOOLEAN,
                defaultValue: 1,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
            },
            from_mobile: {
                type: DataTypes.BOOLEAN,
                defaultValue: 0,
                allowNull: false,
                comment: '1 = Yes, 0 = No',
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
            createdAt: 'created_at',  
            updatedAt: 'updated_at',        
          }
    );
 
    return nmsaAgent;
}
 
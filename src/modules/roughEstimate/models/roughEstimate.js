export default function roughEstimateDatas(sequelize, DataTypes) {
    const RoughEstimate = sequelize.define(
        'rough_estimate',
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
            document_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            roughEstimateNumber: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                validate: {
                    notNull: {
                        msg: 'roughEstimateNumber is required',
                    },
                },
            },

            vehicleId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            estimateId: {
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
            km: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            insuranceId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            insuranceName: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            insuranceExpDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            insurancePolicyNumber: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            customerStatus: {
                type: DataTypes.STRING(20),
                defaultValue: 0,
                allowNull: false,
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
            chassisNumber: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            engineNumber: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            gstinNumber: {
                type: DataTypes.STRING(45),
                allowNull: true,
                unique: true,
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

    return RoughEstimate;
}

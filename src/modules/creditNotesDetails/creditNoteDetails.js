export default function creditNotesDetails(sequelize, DataTypes) {
    const creditNotesDetails = sequelize.define(
        'credit_notes_details',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },

            
            cn_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'credit_debit_notes',
                    key: 'id'
                },
            },

            outlet_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            transaction_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            rot_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            schedule_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            rot_code: {
                type: DataTypes.STRING,
                allowNull: false
            },

            rot_description: {
                type: DataTypes.TEXT,
                allowNull: false,
              },

            hsn: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            amount: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0.0,
            },

            discount_percentage: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0.0,
              },

              sgst: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0.0,
              },

              cgst: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0.0,
              },

              igst: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0.0,
              },

              depreciation_per: {
                type: DataTypes.DOUBLE,
                allowNull: false,
                defaultValue: 0,
              },

              marginPercentage: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
              },

            additional_margin: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0.0,
            },

            total: {
                type: DataTypes.DOUBLE(20, 2),
                allowNull: true,
                defaultValue: 0.0,
            },

            repairType: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                allowNull: true,
            },

            itemType: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                allowNull: true,
            },

            created_by: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            updated_by: {
                type: DataTypes.STRING(225),
                allowNull: true
            }
        },

        {
            timestamps: true,
            createdAt: true,
            updatedAt: true
        }
    );

    return creditNotesDetails;
};

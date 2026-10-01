export default function casualGatePass(sequelize, DataTypes) {
    const casualGatePass = sequelize.define(
        'casual_gate_pass',
        {
            id: {
                type: DataTypes.INTEGER,
                allownull: false,
                primaryKey: true,
                autoIncrement: true
            },

            reg_no: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },

            makeId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                  model: 'makes',
                  key: 'id',
                },
            },

            modelId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                  model: 'models',
                  key: 'id',
                },
            },

            technicianId: {
              type: DataTypes.INTEGER,
              allowNull: true,
              references: {
                model: 'employees',
                key: 'id',
              },
          },

            customerName: {
                type: DataTypes.STRING(50),
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
                type: DataTypes.STRING(20),
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

            reason: {
                type:  DataTypes.STRING(225),
                allowNull: true,
              },

            gateInTime: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            nextAppointmentDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            remarks: {
                type: DataTypes.STRING(45),
                allowNull: true,
            },

            createdBy: {
              type: DataTypes.INTEGER,
              allowNull: false
            },

            updatedBy: {
              type: DataTypes.INTEGER,
            },

            document_no: {
              type: DataTypes.STRING(255),
              allowNull: false
            },
            outlet_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },
        },
        {
          timestamps: true,
          createdAt: true,
          updatedAt: true
        }
    );

    return casualGatePass;
}
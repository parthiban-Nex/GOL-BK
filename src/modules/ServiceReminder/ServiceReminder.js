export default function serviceReminder(sequelize, DataTypes) {
    const serviceReminder = sequelize.define(
        'service_reminder',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },

            scheduleId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                  model: 'schedules',
                  key: 'id',
                },
            },
            
            scheduleCode: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            scheduleDescription: {
                type: DataTypes.STRING(200),
                allowNull: true
            },

            group_code: {
                type: DataTypes.TINYINT,
                allowNull: true,
                defaultValue: 0
            },
        },
        {
            createdAt: true,
            updatedAt: true
        }
    );

    return serviceReminder;
}
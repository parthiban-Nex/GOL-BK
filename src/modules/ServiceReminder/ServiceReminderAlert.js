export default function serviceReminderAlert(sequelize, DataTypes){
    const serviceReminderAlert = sequelize.define(
        'service_reminder_alerts',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },

            outlet_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },

            jc_id: {
                type: DataTypes.INTEGER,
                // allownull: false
                allowNull: true
            },

            lead_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            jc_number: {
                type: DataTypes.STRING(30),
                allownull: false
            },

            schedule_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },

            schedule_code: {
                type: DataTypes.STRING(30),
                allownull: true
            },

            schedule_description: {
                type: DataTypes.STRING(100),
                allownull: true
            },

            customer_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },

            customer_code: {
                type: DataTypes.STRING(20),
                allownull: false
            },

            vehicle_id: {
                type: DataTypes.INTEGER,
                allownull: true
            },

            vehicle_reg_no: {
                type: DataTypes.STRING(20),
                allownull: true
            },

            avg_km_per_day: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            avg_km_btw_service: {
                type: DataTypes.INTEGER,
                allownull: true
            },

            last_service_km: {
                type: DataTypes.INTEGER,
                allownull: true
            },

            last_service_date: {
                type: DataTypes.DATE,
                allownull: true
            },

            next_service_date: {
                type: DataTypes.DATE,
                allownull: true
            },

            tvs_next_service_date: {
                type: DataTypes.DATE,
                allownull: true
            },

            created_by: {
                type: DataTypes.STRING(255),
                allownull: true
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

    return serviceReminderAlert;
};

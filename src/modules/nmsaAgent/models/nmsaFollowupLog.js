export default function nmsafollowuplogdatas(sequelize, DataTypes) {
    const nmsaFollowupLog = sequelize.define(
        'nmsa_followup_logs',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            nmsaAgentId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            dispositionId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            appointment_status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = Open, 2 = In Progress, 3 = Completed, 4 = Cancelled',                
            },
            schedule_start_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            schedule_end_time: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            next_followup: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            appointment_booked_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            phonecall_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
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

    return nmsaFollowupLog;
}

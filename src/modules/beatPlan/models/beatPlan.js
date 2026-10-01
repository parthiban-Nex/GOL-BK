export default function beatplandatas(sequelize, DataTypes) {
    const beatPlan = sequelize.define(
        'beat_plans',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            franchise_type: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: '1 = new, 0 = existing',
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            pincode: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            state: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },

            city: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },
            area: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            planned_leads: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = Open, 2 = In Progress, 3 = Completed, 4 = Cancelled',
            },
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            updatedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            timestamps: true,
            createdAt: 'created_at',  
            updatedAt: 'updated_at',         
          }
    );

    return beatPlan;
}

export default function activityplandatas(sequelize, DataTypes) {
    const activityPlan = sequelize.define(
        'activity_plans',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            is_new: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = new, 0 = existing',
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

    return activityPlan;
}

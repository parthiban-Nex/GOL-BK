export default function workshopcategorydatas(sequelize, DataTypes) {
    const workshopCategory = sequelize.define(
        'workshop_categories',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING(25),
                allowNull: false,
                unique: true,
            },
            status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = Active, 0 = Inactive',
            },
        },
        {
            timestamps: true,
            createdAt: 'created_at',  
            updatedAt: 'updated_at',         
        }
    );

    return workshopCategory;
}

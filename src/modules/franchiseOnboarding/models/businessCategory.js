export default function businesscategorydatas(sequelize, DataTypes) {
    const BusinessCategory = sequelize.define(
        'business_categories',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            workshop_category_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    notNull: {
                        msg: 'Title is required',
                    },
                },
            },
            status: { 
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 1,
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
            createdAt: 'created',
            updatedAt: false,
        }
    );

    return BusinessCategory;
}
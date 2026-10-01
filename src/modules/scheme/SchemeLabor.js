export default function schemeLaborDatas(sequelize, DataTypes) {
    const schemeLabor = sequelize.define(
        'scheme_labors',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },

            labor_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            labor_code: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            
            scheme_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            labor_amount: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            labour_description:{
                type: DataTypes.STRING(100),
                allowNull: true
            },

            count: {
                type: DataTypes.INTEGER,
                allowNull: true
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
            createdAt: true,
            updatedAt: true,
        }
    );

    return schemeLabor;
}
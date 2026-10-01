export default function schemePartDatas(sequelize, DataTypes) {
    const schemePart = sequelize.define(
        'scheme_parts',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },

            part_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            part_code: {
                type: DataTypes.STRING(100),
                allowNull: true
            },

            scheme_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            part_amount: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            part_description:{
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

    return schemePart;
}
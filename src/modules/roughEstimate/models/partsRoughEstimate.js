export default function partsRoughEstimatedatas(sequelize, DataTypes) {
    const PartsRoughEstimate = sequelize.define(
        'parts_rough_estimate',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            roughEstimateId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            partDescription: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            rate: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            tax: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            partTotal: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            freezeTableName: true,
            timestamps: true,
            createdAt: true,
            updatedAt: true,
        }
    );

    return PartsRoughEstimate;
}

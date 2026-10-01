export default function beatplanfranchiseupdatedatas(sequelize, DataTypes) {
    const beatPlanFranchiseUpdate = sequelize.define(
        'beatplafranchiseupdates',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },

            beatPlanId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            franchiseId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            collection_of_payment: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            reference_number: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            amt_received: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            image1: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image1_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image2: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            image2_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            current_location: {
                type: DataTypes.TEXT,
                allowNull: true,
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
            createdAt: true,
            updatedAt: true,
        }
    );

    return beatPlanFranchiseUpdate;
}

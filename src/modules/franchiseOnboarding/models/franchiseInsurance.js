export default function franchiseinsurancedatas(sequelize, DataTypes) {
    const FranchiseInsurance = sequelize.define(
        'franchise_insurances',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            active: { 
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

    return FranchiseInsurance;
}
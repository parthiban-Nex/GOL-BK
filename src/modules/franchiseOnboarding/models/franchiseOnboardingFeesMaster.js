export default function franchiseonboardingfeesmasterdatas(sequelize, DataTypes) {
    const FranchiseOnboardingFeesMaster = sequelize.define(
        'franchise_onboarding_fees_master',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
            fees: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                validate: {
                    notNull: {
                        msg: 'Fees is required',
                    },
                },
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 1,
                comment: '1 => Active, 2 => Inactive'
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


    return FranchiseOnboardingFeesMaster;
}
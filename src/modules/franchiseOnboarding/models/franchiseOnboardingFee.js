export default function franchiseonboardingfeedatas(sequelize, DataTypes) {
    const FranchiseOnboardingFee = sequelize.define(
        'franchise_onboarding_fees',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            franchise_onboarding_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notNull: {
                        msg: 'Franchise onboarding ID is required',
                    },
                },
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            fee_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            fees: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            paid_amt: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            payment_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            payment_reference_number: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            payment_mode: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            payment_doc: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            payment_doc_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            fee_approve: {
                type: DataTypes.TINYINT,
                allowNull: true,
                defaultValue: 0,
                comment: '0=Pending,1=Approved,2=Rejected',
            },
            fee_rejection_remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            updatedBy: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
        },
        {
            timestamps: true,
            createdAt: 'created',
            updatedAt: false,
        }
    );

    return FranchiseOnboardingFee;
}
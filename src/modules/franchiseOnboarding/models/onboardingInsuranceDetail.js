export default function onboardinginsurancedetaildatas(sequelize, DataTypes) {
    const OnboardingInsuranceDetail = sequelize.define(
        'onboarding_insurance_details',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            franchise_onboarding_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            insurance_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            cashless_code_needed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 1,
            },
            cashless_code_required: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            cashless_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            insurance_pdf: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            insurance_pdf_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
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

    return OnboardingInsuranceDetail;
}
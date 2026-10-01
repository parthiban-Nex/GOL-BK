export default function schemeDatas(sequelize, DataTypes) {
    const Scheme = sequelize.define(
        'scheme',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },

            repair_type_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            repair_type_name: {
                type: DataTypes.STRING(220),
                allowNull: true
            },

            scheme_name: {
                type: DataTypes.STRING(220),
                allowNull: true
            },

            scheme_period: {
                type: DataTypes.INTEGER,
                allowNUll: true
            },

            scheme_amount: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            status: {
                type: DataTypes.TINYINT,
                allowNull: false
            },

            tax_percentage: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            cgst_tax: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },
            
            sgst_tax: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            igst_tax: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            discount: {
                type: DataTypes.DOUBLE,
                allowNull: true
            },

            makeId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            hsnCode: {
                type: DataTypes.STRING(50),
                allowNull: true
            },

            modelId: {
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

    return Scheme;
}
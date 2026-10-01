export default function lbsDebitNotesData(sequelize, DataTypes) {
    const lbsDebitNotes = sequelize.define(
        'lbs_debit_notes',
        {
            id: {
                type: DataTypes.INTEGER,
                allownull: false,
                primaryKey: true,
                autoIncrement: true
            },

            outlet_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },


            doc_no: {
                type: DataTypes.STRING(255),
                allownull: false
            },

            transaction_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },

            jc_number: {
                type: DataTypes.STRING(255),
                allownull: true
            },

            customer_id: {
                type: DataTypes.INTEGER,
                allownull: false,
            },

            customer_code: {
                type: DataTypes.STRING(255),
                allownull: false,
            },

            customer_gstin: {
                type: DataTypes.STRING(50),
                allownull: false
            },

            vehicle_id: {
                type: DataTypes.INTEGER,
                allownull: false
            },

            reg_no: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },

            purpose: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            narration: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            amount: {
                type: DataTypes.DOUBLE,
                allowNull: false
            },
            status: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                allowNull: true,
            },
            lbs_ins_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            lbs_ins_code: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            created_by: {
                type: DataTypes.STRING(100),
                allownull: true
            },

            updated_by: {
                type: DataTypes.STRING(100),
                allowNull: true
            }
        },

        {
            timestamps: true,
            createdAt: true,
            updatedAt: true
          }
    )

    return lbsDebitNotes;
}

export default function TransactionUpdate(sequelize, DataTypes) {
    const TransactionUpdate = sequelize.define(
        'transaction_updates',
        {
            id: { 
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            transaction_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notNull: { msg: 'Transfer ID is required' },
                },
            },
            invoice_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    notNull: { msg: 'Invoice Number is required' },
                },
            },
            grand_total: {
                type: DataTypes.DECIMAL(11, 2),
                allowNull: false,
                validate: {
                    notNull: { msg: 'Grand Total is required' },
                },
            },
            bdo_id: {
                type: DataTypes.STRING(30),
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'Bdo ID is required' },
                // },
            },
            invoice_bdoack_no: {
                type: DataTypes.STRING(30),
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'Invoice Bdo Ack Number is required' },
                // },
            },
            invoice_bdoack_date: {
                type: DataTypes.DATE,
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'Invoice Bdo Date is required' },
                // },
            },
            irn_no: {
                type: DataTypes.TEXT,
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'IRN NUMBER is required' },
                // },
            },
            qr_code: {
                type: DataTypes.TEXT,
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'QR Code is required' },
                // },
            },
            signed_qr_code: {
                type: DataTypes.TEXT,
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'Signed QR Code is required' },
                // },
            },
            process_status: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            bdo_status: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            pass_args: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notNull: { msg: 'Pass Arg is required' },
                },
            },
            response_arg: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                // validate: {
                //     notNull: { msg: 'Response Arg is required' },
                // },
            },
            created_by: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    notNull: { msg: 'Created By is required' },
                },
            },
        },
        {
            freezeTableName: true,
            tableName: 'transaction_updates',
            timestamps: true, 
        }
    );
     // 👇 Define association with JobCard table
     TransactionUpdate.associate = function (models) {
        TransactionUpdate.belongsTo(models.JobCard, {
            foreignKey: 'transaction_id',
            as: 'jobCardMappingUpdate', 
        });
    };
    return TransactionUpdate;


}
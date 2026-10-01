export default function counterSaleUpdates (sequelize, DataTypes)  {
    const CounterSaleUpdate = sequelize.define(
        'counter_sale_updates',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            counter_sale_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notNull: { msg: 'CounterSaleId is required' },
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
                // allowNull: false,
                // validate: {
                //     notNull: { msg: 'Bdo ID is required' },
                // },
            },
            invoice_bdoack_no: {
                type: DataTypes.STRING(30),
                // allowNull: false,
                // validate: {
                //     notNull: { msg: 'Invoice Bdo Ack Number is required' },
                // },
            },
            invoice_bdoack_date: {
                type: DataTypes.DATE,
                // allowNull: false,
                // validate: {
                //     notNull: { msg: 'Invoice Bdo Date is required' },
                // },
            },
            irn_no: {
                type: DataTypes.TEXT,
                // allowNull: false,
                // validate: {
                //     notNull: { msg: 'IRN NUMBER is required' },
                // },
            },
            qr_code: {
                type: DataTypes.TEXT,
                // allowNull: false,
                // validate: {
                //     notNull: { msg: 'QR Code is required' },
                // },
            },
            signed_qr_code: {
                type: DataTypes.TEXT,
                // allowNull: false,
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
                // allowNull: false,
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
            tableName: 'counter_sale_updates',
            timestamps: true, 
        }
    );

    // Defining Associations
    CounterSaleUpdate.associate = (models) => {
        CounterSaleUpdate.belongsTo(models.Countersale, {
            foreignKey: 'counter_sale_id',
            as: 'counter_sale',
        });
    };

    return CounterSaleUpdate; 
}


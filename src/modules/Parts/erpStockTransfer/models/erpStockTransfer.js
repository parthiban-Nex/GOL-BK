export default function erpstocktransferdata(sequelize, DataTypes) {
    const ErpStockTransfer = sequelize.define('erp_stock_transfers', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        branchId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        branchName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        invoiceNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        invoiceDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        invoiceAmount: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        customerName: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        customerCode: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        mobileNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        orderNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        despatchDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        deliveryDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        shipmentNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        toShippedDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        inward_status: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '1-open, 2-completed',
        },
        grn_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'erp_stock_transfers',
        timestamps: true,
        underscored: false,
    });

    return ErpStockTransfer;
}

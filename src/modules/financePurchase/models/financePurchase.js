export default function financePurchasedatas(sequelize, DataTypes) {
  const FinancePurchase = sequelize.define(
    'finance_purchase',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      purchaseCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vendor: {
        type: DataTypes.STRING(250),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Vendor is required',
          },
        },
      },
      invoiceNo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Invoice number is required',
          },
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      paymentMode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      exclGst: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      gst: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      inclGst: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      paid: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      pending: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      documentLink: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      outletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
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
      tableName: 'finance_purchases',
      timestamps: true,
    }
  );

  return FinancePurchase;
}

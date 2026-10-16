export default function financePurchaseVendordatas(sequelize, DataTypes) {
  const FinancePurchaseVendor = sequelize.define(
    'finance_purchase_vendor',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      vendorCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      vendorName: {
        type: DataTypes.STRING(250),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Vendor name cannot be empty',
          },
        },
      },
      vendorType: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paymentTerms: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contactPerson: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      gst: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      address: {
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
      tableName: 'finance_purchase_vendors',
      timestamps: true,
    }
  );

  return FinancePurchaseVendor;
}

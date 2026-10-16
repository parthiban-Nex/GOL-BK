export default function expensedatas(sequelize, DataTypes) {
  const Expense = sequelize.define(
    'expense',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      expenseCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      head: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Expense head is required',
          },
        },
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Expense type is required',
          },
        },
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
            msg: 'Vendor / payee is required',
          },
        },
      },
      invoiceNo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Invoice / reference number is required',
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
      tableName: 'expenses',
      timestamps: true,
    }
  );

  return Expense;
}

export default function expensepaymentdatas(sequelize, DataTypes) {
  const ExpensePayment = sequelize.define(
    'expense_payment',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      expenseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paymentMode: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      referenceNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      notes: {
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
      createdByName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: 'expense_payments',
      timestamps: true,
    }
  );

  return ExpensePayment;
}

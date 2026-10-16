export default function bankDepositdatas(sequelize, DataTypes) {
  const BankDeposit = sequelize.define(
    'bank_deposit',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      depositCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      depositDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Deposit date is required',
          },
        },
      },
      depositTime: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Bank name is required',
          },
        },
      },
      bankAccountNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      branch: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      bankId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      depositMode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Cash',
      },
      referenceNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      depositedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Deposited',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slipUrl: {
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
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'bank_deposits',
      timestamps: true,
      indexes: [
        { fields: ['depositCode'] },
        { fields: ['depositDate'] },
        { fields: ['status'] },
        { fields: ['branch'] },
        { fields: ['outletId'] },
        { fields: ['companyId'] },
        { fields: ['isDeleted'] },
      ],
    }
  );

  return BankDeposit;
}

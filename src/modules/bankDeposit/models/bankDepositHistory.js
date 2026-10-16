export default function bankDepositHistorydatas(sequelize, DataTypes) {
  const BankDepositHistory = sequelize.define(
    'bank_deposit_history',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      depositId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      depositCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      outletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      editedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      editorName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      oldAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      newAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      oldBankName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      newBankName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      oldAccountNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      newAccountNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      oldBranch: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      newBranch: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      oldDepositDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      newDepositDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      oldDepositMode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      newDepositMode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      oldStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      newStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      oldReferenceNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      newReferenceNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      oldNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      changeSummary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      previousData: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newData: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'bank_deposit_histories',
      timestamps: true,
      indexes: [
        { fields: ['depositId'] },
        { fields: ['depositCode'] },
        { fields: ['editedAt'] },
        { fields: ['outletId'] },
        { fields: ['companyId'] },
      ],
    }
  );

  return BankDepositHistory;
}

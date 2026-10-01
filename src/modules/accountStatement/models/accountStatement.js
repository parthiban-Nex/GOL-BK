export default function accountStatementDatas(sequelize, DataTypes) {
  const AccountStatement = sequelize.define(
    'account_statement',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      fbmId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'fbm_id',
      },
      outletId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'outlet_id',
      },
      branch: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_name',
      },
      cloudLink: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'cloud_link',
      },
      statementOfMonth: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'statement_of_month',
      },
      statementOfYear: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'statement_of_year',
      },
      approvalStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'approval_status',
        comment: '0=pending, 1=accepted, 2=rejected',
      },
      approvalAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approval_at',
      },
      approvalCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'approval_count',
      },
      replyNotification: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'reply_notification',
      },
      financeNotification: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: 'finance_notification',
        comment: '0=none, 1=accepted(non-clickable), 2=rejected/chat(clickable)',
      },
    },
    {
      tableName: 'account_statements',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return AccountStatement;
}

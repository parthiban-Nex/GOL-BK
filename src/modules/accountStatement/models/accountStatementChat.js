export default function accountStatementChatDatas(sequelize, DataTypes) {
  const AccountStatementChat = sequelize.define(
    'account_statement_chat',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      statement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      query_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sender_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'outlet_admin or fbm_user',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return AccountStatementChat;
}

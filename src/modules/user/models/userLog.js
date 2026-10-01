export default function userlogdatas(sequelize, DataTypes) {
  const UserLog = sequelize.define(
    'user_log',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      login_time: {
        type: DataTypes.DATE,
      },
      logout_time: {
        type: DataTypes.DATE,
      },
      time_duration: {
        type: DataTypes.STRING,
      },
      access: {
        type: DataTypes.STRING,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return UserLog;
}

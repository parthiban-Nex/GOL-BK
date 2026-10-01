export default function recentActivityDatas(sequelize, DataTypes) {
  const RecentAcivity = sequelize.define(
    'master_recent_activity',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      activity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      menu_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: false,
    }
  );

  return RecentAcivity;
}

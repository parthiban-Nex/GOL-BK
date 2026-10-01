export default function auditlogdatas(sequelize, DataTypes, tablename) {
  const AuditLog = sequelize.define(
    tablename,
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      roleId: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      message: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },

      url: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      menu_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      submenu_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },

      action: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      result: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      access: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      createdAt: true,
      updatedAt: false,
    }
  );

  return AuditLog;
}

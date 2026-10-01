export default function roleSubmenuButtondatas(sequelize, DataTypes) {
  const roleSubmenuButtons = sequelize.define(
    'role_submenu_settings',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },
      submenuId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      button_operation: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    }
  );

  return roleSubmenuButtons;
}

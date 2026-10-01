export default function roleMenuTabSettingsDatas(sequelize, DataTypes) {
  const RoleMenuTabSettings = sequelize.define(
    'role_menu_tab_settings',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      menuId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      submenuId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tab_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tab_menu_operation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    }
  );

  return RoleMenuTabSettings;
}

export default function rolesettingsdatas(sequelize, DataTypes) {
  const rolesettings = sequelize.define(
    'role_menu_settings',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roleId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      menuId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      submenuIds: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      menu_operation: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return rolesettings;
}

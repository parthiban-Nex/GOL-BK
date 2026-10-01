export default function menudatas(sequelize, DataTypes) {
  const menuList = sequelize.define(
    'menu_list',

    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      activeIcon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      path: {
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

  return menuList;
}

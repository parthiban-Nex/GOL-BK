export default function subMenudatas(sequelize, DataTypes) {
  const submenuList = sequelize.define(
    'submenu_list',
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
      path: {
        type: DataTypes.INTEGER,
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

  return submenuList;
}

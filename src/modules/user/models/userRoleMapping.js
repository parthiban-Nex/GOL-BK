export default function userrolemapDatas(sequelize, DataTypes) {
  const UserRoleMapping = sequelize.define(
    'userrolemap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      primary_role: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      role_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return UserRoleMapping;
}

export default function roledatas(sequelize, DataTypes) {
  const roles = sequelize.define(
    'role',

    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return roles;
}

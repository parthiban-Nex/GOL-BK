export default function useroutletmapdatas(sequelize, DataTypes) {
  const UserOutletMapping = sequelize.define(
    'useroutletmap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },

      outletId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'outlets',
          key: 'id',
        },
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return UserOutletMapping;
}

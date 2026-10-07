export default function partCartDatas(sequelize, DataTypes) {
  const PartCart = sequelize.define(
    'part_carts',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      workshopId: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      cart: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: { selected: [], compare: [], parts: [] },
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'ACTIVE',
      },
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return PartCart;
}

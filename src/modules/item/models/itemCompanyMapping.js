export default function itemcompanymapdatas(sequelize, DataTypes) {
  const ItemCompanyMap = sequelize.define(
    'itemcompanymap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      itemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'items',
          key: 'id',
        },
      },

      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id',
        },
      },
    },
    {
      timestamps: false,
    }
  );

  return ItemCompanyMap;
}

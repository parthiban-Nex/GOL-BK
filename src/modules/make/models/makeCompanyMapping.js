export default function makecompanymapdatas(sequelize, DataTypes) {
  const MakeCmpanyMap = sequelize.define(
    'makecompanymaps',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      makeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'makes',
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

  return MakeCmpanyMap;
}

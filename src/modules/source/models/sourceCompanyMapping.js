export default function sourcecompanymapdatas(sequelize, DataTypes) {
  const SourceCompanyMap = sequelize.define(
    'sourcecompanymap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      sourceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sources',
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

  return SourceCompanyMap;
}

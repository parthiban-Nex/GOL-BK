export default function sourcetypecompanymapdatas(sequelize, DataTypes) {
  const SourceTypeCompanyMap = sequelize.define(
    'sourcetypecompanymap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      sourceTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sourcetypes',
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

  return SourceTypeCompanyMap;
}

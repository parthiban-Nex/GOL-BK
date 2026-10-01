export default function servicetypecompanymapdatas(sequelize, DataTypes) {
  const ServiceTypeCompanyMap = sequelize.define(
    'servicetypecompanymap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      serviceTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'servicetypes',
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

  return ServiceTypeCompanyMap;
}

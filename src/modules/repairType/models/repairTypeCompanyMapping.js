export default function repairtypecompanymapdatas(sequelize, DataTypes) {
  const RepairTypeCompanyMap = sequelize.define(
    'repairtypecompanymap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      repairTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'repairtypes',
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

  return RepairTypeCompanyMap;
}

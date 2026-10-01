export default function laboroutletmapdatas(sequelize, DataTypes) {
  const LaborOutletMap = sequelize.define(
    'laboroutletmap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
 
      laborId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'laborschedules',
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
      timestamps: false,
    }
  );

  return LaborOutletMap;
}

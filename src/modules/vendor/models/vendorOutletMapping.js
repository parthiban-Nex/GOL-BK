export default function vendoroutletmapdatas(sequelize, DataTypes) {
  const VendorOutletMap = sequelize.define(
    'vendoroutletmap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'vendors',
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

  return VendorOutletMap;
}

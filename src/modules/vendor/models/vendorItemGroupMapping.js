export default function vendoritemgroupmapdatas(sequelize, DataTypes) {
  const VendorItemGroupMap = sequelize.define(
    'vendoritemgroupmap',
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

      itemGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'itemgroups',
          key: 'id',
        },
      },
      itemGroupCode: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'ItemGroup Code is required',
          },
          notEmpty: {
            msg: 'ItemGroup Code is not Empty',
          },
        },
      },
    },
    {
      timestamps: false,
    }
  );

  return VendorItemGroupMap;
}

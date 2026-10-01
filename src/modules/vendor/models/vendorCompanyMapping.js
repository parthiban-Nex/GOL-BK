export default function vendorcompanymapdatas(sequelize, DataTypes) {
  const VendorCompanyMap = sequelize.define(
    'vendorcompanymap',
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

      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Company Name is required',
          },
          notEmpty: {
            msg: 'Company Name is not Empty',
          },
        },
      },
    },
    {
      timestamps: false,
    }
  );

  return VendorCompanyMap;
}

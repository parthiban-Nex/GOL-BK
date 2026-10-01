export default function dsaagentcompanymapdatas(sequelize, DataTypes) {
  const DsaagentCompanyMap = sequelize.define(
    'dsaagentcompanymap',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      dsaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dsaagents',
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

  return DsaagentCompanyMap;
}

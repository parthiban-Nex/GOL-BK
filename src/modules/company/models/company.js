export default function companydatas(sequelize, DataTypes) {
  const Company = sequelize.define(
    'company',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Company Code is required',
          },
          notEmpty: {
            msg: 'Company Code is not Empty',
          },
        },
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
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
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
      },
      enable_einvoice: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      customer_account_type: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return Company;
}

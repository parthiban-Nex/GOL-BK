export default function bankdatas(sequelize, DataTypes) {
  const Bank = sequelize.define(
    'bank',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      bankName: {
        type: DataTypes.STRING(250),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Bank Name is required',
          },
          notEmpty: {
            msg: 'Bank Name is not empty',
          },
        },
      },

      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      updatedBy: {
        type: DataTypes.INTEGER,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return Bank;
}

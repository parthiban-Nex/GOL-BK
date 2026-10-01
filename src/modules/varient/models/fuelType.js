export default function fueltypedatas(sequelize, DataTypes) {
  const FuelType = sequelize.define(
    'fueltypes',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      fuelTypeName: {
        type: DataTypes.STRING(25),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'FuelType is required',
          },
          notEmpty: {
            msg: 'FuelType is not Empty',
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

  return FuelType;
}

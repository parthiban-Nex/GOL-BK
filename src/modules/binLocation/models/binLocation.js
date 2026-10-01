export default function binLocationDatas(sequelize, DataTypes) {
  const BinLocation = sequelize.define(
    'binlocation',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      binLocation: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'BinLocation  must be unique',
          arg: true,
        },
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'BinLocation is required',
          },
          notEmpty: {
            msg: 'BinLocation is not Empty',
          },
        },
      },
      binLocationDescription: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      outletCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'OutletCode is required',
          },
          notEmpty: {
            msg: 'OutletCode is not Empty',
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

  return BinLocation;
}

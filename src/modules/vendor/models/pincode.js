export default function pincodedatas(sequelize, DataTypes) {
  const PinCode = sequelize.define(
    'pincode',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      Pincode: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      District: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'CityName is required',
          },
          notEmpty: {
            msg: 'CityName is not empty',
          },
        },
      },
      OfficeName: {
        type: DataTypes.STRING(250),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'AreaName is required',
          },
          notEmpty: {
            msg: 'AreaName is not empty',
          },
        },
      },

      StateName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'StateName is required',
          },
          notEmpty: {
            msg: 'StateName is not empty',
          },
        },
      },

      CircleName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      RegionName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      DivisionName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      OfficeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Delivery: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Latitude: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      Longitude: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },
      cv_cityId: {
        type: DataTypes.INTEGER,
      },
      cv_stateId: {
        type: DataTypes.INTEGER,
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

  return PinCode;
}

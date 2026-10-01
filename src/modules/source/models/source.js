export default function sourcedatas(sequelize, DataTypes) {
  const Source = sequelize.define(
    'source',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      sourceName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'sourceName is required',
          },
          notEmpty: {
            msg: 'sourceName is not empty',
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
     bridge_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      }

    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return Source;
}

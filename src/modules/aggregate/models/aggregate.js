export default function aggregateDatas(sequelize, DataTypes) {
  const Aggregate = sequelize.define(
    'aggregate',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      aggregateName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'Aggregate name must be unique',
          arg: true,
        },
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Aggregate is required',
          },
          notEmpty: {
            msg: 'Aggregate is not Empty',
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

  return Aggregate;
}

export default function makedatas(sequelize, DataTypes) {
  const Makes = sequelize.define(
    'makes',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      makeName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'Make name must be unique',
          arg: true,
        },
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Model is required',
          },
          notEmpty: {
            msg: 'Model is not Empty',
          },
        },
      },

      makeDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
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

  return Makes;
}

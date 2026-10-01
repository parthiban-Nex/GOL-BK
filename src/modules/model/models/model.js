export default function modeldatas(sequelize, DataTypes) {
  const Model = sequelize.define(
    'models',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      makeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'makes',
          key: 'id',
        },
      },

      modelName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Model name must be unique',
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

      modelDescription: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },

      segment: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },

      vehicletypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'vehicletypes',
          key: 'id',
        },
      },
      varientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'varients',
          key: 'id',
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

  return Model;
}

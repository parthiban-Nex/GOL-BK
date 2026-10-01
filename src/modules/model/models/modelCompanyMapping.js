export default function modelcompanymapdatas(sequelize, DataTypes) {
  const ModelCmpanyMap = sequelize.define(
    'modelcompanymaps',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'models',
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
      companyName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    }
  );

  return ModelCmpanyMap;
}

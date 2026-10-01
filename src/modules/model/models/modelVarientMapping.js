export default function modelvarientmapdatas(sequelize, DataTypes) {
  const ModelCmpanyMap = sequelize.define(
    'modelvarientmaps',
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

    varientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'varients',
          key: 'id',
        },
      },
      
    },
    {
      timestamps: false,
    }
  );

  return ModelCmpanyMap;
}

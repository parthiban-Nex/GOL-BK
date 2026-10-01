export default function subaggregateDatas(sequelize, DataTypes) {
  const SubAggregate = sequelize.define(
    'subaggregate',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      subAggregateName: {
        type: DataTypes.STRING(250),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Sub Aggregate is required',
          },
          notEmpty: {
            msg: 'Sub Aggregate is not Empty',
          },
        },
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },

      aggregateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'aggregates',
          key: 'id',
        },
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

  return SubAggregate;
}

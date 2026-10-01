export default function sourcetypedatas(sequelize, DataTypes) {
  const SourceType = sequelize.define(
    'sourcetype',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      sourceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'sources',
          key: 'id',
        },
      },
      sourceTypeName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'sourceTypeName is required',
          },
          notEmpty: {
            msg: 'sourceTypeName is not empty',
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

  return SourceType;
}

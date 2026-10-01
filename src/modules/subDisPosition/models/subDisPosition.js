export default function subdispositiondatas(sequelize, DataTypes) {
  const SubDisPosition = sequelize.define(
    'subdisposition',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      disPositionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dispositions',
          key: 'id',
        },
      },
      subDisPositionTitle: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      subDisPositionCode: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'code is required',
          },
          notEmpty: {
            msg: 'code is not empty',
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

  return SubDisPosition;
}

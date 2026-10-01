export default function billTypeDatas(sequelize, DataTypes) {
  const BillType = sequelize.define(
    'billtype',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      billType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'billType is required',
          },
          notEmpty: {
            msg: 'billType is not Empty',
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

  return BillType;
}

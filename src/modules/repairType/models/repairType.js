export default function repairtypedatas(sequelize, DataTypes) {
  const RepairType = sequelize.define(
    'repairtype',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      repairTypeName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'RepairTypeName is required',
          },
          notEmpty: {
            msg: 'RepairTypeName is not empty',
          },
        },
      },
      scheme: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'scheme is required',
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

  return RepairType;
}

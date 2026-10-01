export default function uomdatas(sequelize, DataTypes) {
  const Uom = sequelize.define(
    'uom',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uomType: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Uom Type is required',
          },
          notEmpty: {
            msg: 'Uom Type is not Empty',
          },
        },
      },
      uomDescription: {
        type: DataTypes.STRING(250),
        allowNull: true,
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
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );
  return Uom;
}

export default function servicetypedatas(sequelize, DataTypes) {
  const ServiceType = sequelize.define(
    'servicetype',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      serviceTypeName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'ServiceTypeName is required',
          },
          notEmpty: {
            msg: 'ServiceTypeName is not empty',
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

  return ServiceType;
}

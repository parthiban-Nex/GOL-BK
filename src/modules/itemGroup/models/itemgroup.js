export default function itemgroupdatas(sequelize, DataTypes) {
  const Itemgroup = sequelize.define(
    'itemgroup',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      itemGroupCode: {
        type: DataTypes.STRING(25),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'ItemGroup Code is required',
          },
          notEmpty: {
            msg: 'ItemGroup Code is not Empty',
          },
        },
      },
      itemGroupDescription: {
        type: DataTypes.STRING(200),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'itemGroupDescription is required',
          },
          notEmpty: {
            msg: 'itemGroupDescription is not Empty',
          },
        },
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: true,
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

  return Itemgroup;
}

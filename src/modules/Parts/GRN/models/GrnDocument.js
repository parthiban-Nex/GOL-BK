export default function GrnDocuments(sequelize, DataTypes) {
  const Grn_Documnt = sequelize.define(
    'grndocument',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING(),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'name is required',
          },
        },
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'createdBy is required',
          },
        },
      },
    },
    {
      timestamps: true,
    }
  );

  return Grn_Documnt;
}

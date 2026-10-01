export default function itemcategoriedatas(sequelize, DataTypes) {
  const Itemcategorie = sequelize.define(
    'itemcategorie',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      itemCategorie: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Item Categorie is required',
          },
          notEmpty: {
            msg: 'Item Categorie is not Empty',
          },
        },
      },
      itemCategorieDescription: {
        type: DataTypes.STRING(200),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Item Categorie is required',
          },
          notEmpty: {
            msg: 'Item Categorie is not Empty',
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

  return Itemcategorie;
}

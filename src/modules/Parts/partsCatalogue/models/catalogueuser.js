export default function CatalogueUsers(sequelize, DataTypes) {
    const CatalogueUsers = sequelize.define(
      "catalogue_users",
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        outlet_code: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
      },
      {
        timestamps: true, 
      }
    );
  
    return CatalogueUsers;
  }
  
export default function referencedatas(sequelize, DataTypes) {
    const reference = sequelize.define(
      'reference',
  
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        ref_name: {
          type: DataTypes.STRING,
        },
        ref_value: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
          },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
        }
      },
      {
        freezeTableName: true,
        timestamps: false,
        createdAt: false,
        updatedAt: false,
      }
    );
  
    return reference;
  }
  
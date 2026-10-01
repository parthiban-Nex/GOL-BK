export default function returnablePartsData(sequelize, DataTypes) {
  const ReturnableParts = sequelize.define(
    'returnable_parts',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      returnable_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    },
    {
      timestamps: true,         
      createdAt: 'created_at',  
      updatedAt: false          
    }
  );

  return ReturnableParts;
}

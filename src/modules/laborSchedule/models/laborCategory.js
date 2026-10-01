export default function laborCategorydatas(sequelize, DataTypes) {
  const LaborCategory = sequelize.define(
'labor_category',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      }, 
      categoryName:{
        type: DataTypes.STRING(100),
        allowNull:false,
      },
      status:{
        type: DataTypes.INTEGER,
         defaultValue: 1,
        allowNull:false,
      }
    },
      {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    },
);

    return LaborCategory;
}
    

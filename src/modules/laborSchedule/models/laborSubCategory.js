export default function laborSubCategorydatas(sequelize, DataTypes) {
  const LaborSubCategory = sequelize.define(
'labor_sub_category',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      categoryId:{
        type: DataTypes.INTEGER,
        allowNull:false,
      },
      subCategoryName:{
        type: DataTypes.STRING(200),
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

    return LaborSubCategory;
}
    

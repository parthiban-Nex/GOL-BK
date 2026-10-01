export default function laborCategoryMappingdatas(sequelize, DataTypes) {
  const LaborCategoryMapping = sequelize.define(
'labour_category_mappings',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      }, 
      labour_code:{
        type: DataTypes.STRING(255),
        allowNull:false,
      },
      labour_id:{
        type: DataTypes.INTEGER,
        allowNull:true,
      },
      category_id:{
        type: DataTypes.INTEGER,
        allowNull:true,
      },
      subcategory_id:{
        type: DataTypes.INTEGER,
        allowNull:true,
      }

    },
      {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    },
);

    return LaborCategoryMapping;
}
    

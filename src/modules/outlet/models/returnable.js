export default function returnabledatas(sequelize, DataTypes) {
  const Returnable = sequelize.define(
    'returnables',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      outletId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      return_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      ret_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vehicle_num: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      make_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      make_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      model_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      model_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type_category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      customer_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      vendor_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.STRING(50),
        allowNull: false,
      }
    },
    {
      timestamps: true,
      createdAt: 'created_at',  
      updatedAt: false,         
    }
  );

  return Returnable; 
}

export default function lbsInsuranceCodeDatas(sequelize, DataTypes) {
    const lbsInsuranceCode = sequelize.define(
      "InsuranceCode",
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
  
        insCode: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
  
        insName: {
          type: DataTypes.STRING(200),
          allowNull: true,
        },
  
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
  
        pincode: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
  
        state: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
  
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
  
    
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
  
        updatedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
  
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: 1,
            allowNull: false,
          },
      },
      {
        tableName: "lbs_insurancecode",
        timestamps: true, 
      }
    );
  
    return lbsInsuranceCode;
  };
  
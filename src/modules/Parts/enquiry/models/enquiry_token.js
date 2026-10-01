export default function EnquiryTokenDatas(sequelize, DataTypes) {
    const EnquiryToken = sequelize.define(
      'enquiry_token',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        outlet_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Outlet is required',
            },
          },
        },
       
        token:{
           type: DataTypes.TEXT,
          allowNull: true,
        },
        expires_at: {
          type: DataTypes.BIGINT,
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
  
    return EnquiryToken;
  }
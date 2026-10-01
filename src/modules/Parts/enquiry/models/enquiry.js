export default function EnquiryDatas(sequelize, DataTypes) {
    const Enquiry = sequelize.define(
      'enquiry',
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
              msg: 'OutletId is required',
            },
          },
        },
        enquiry_no:{
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        external_enquiry_id: {
         type:DataTypes.INTEGER,
         allowNull:false
        },
        transaction_id:{
            type:DataTypes.INTEGER,
         allowNull:false
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
  
    return Enquiry;
  }
export default function EnquiryChatDatas(sequelize, DataTypes) {
    const EnquiryChat = sequelize.define(
      'enquiry_chat',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        enquiry_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'enquiry is required',
            },
          },
        },
        enquiry_no:{
          type: DataTypes.STRING(30),
          allowNull: false,
        },
        message:{
           type: DataTypes.TEXT,
          allowNull: false,
        },
        file_url:{
 type: DataTypes.TEXT,
          allowNull: true,
        },
        isInternal:{
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue:0
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
  
    return EnquiryChat;
  }
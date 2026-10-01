export default function EnquiryIndentDatas(sequelize, DataTypes) {
    const EnquiryIndent = sequelize.define(
      'enquiry_indent',
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
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      item_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      item_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
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
  
    return EnquiryIndent;
  }
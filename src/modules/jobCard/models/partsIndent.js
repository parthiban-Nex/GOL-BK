export default function partsIndentdatas(sequelize, DataTypes) {
  const PartsIndent = sequelize.define(
    'parts_indent',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      item_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      item_name: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false
      },
      request_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      received_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      return_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      part_total: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      discount: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      sgst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      cgst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      igst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      hsn_code: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
      // created_date: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      //   defaultValue: DataTypes.NOW,
      //   field: 'created_date',
      // },
      // updated_Date: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      //   field: 'updated_Date',
      // },
      fitId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approveDatetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvalStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        field: 'approval_status',
      },
      sourceType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'JOB_CARD',
        field: 'source_type',
      },
      sourceEstimateItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'source_estimate_item_id',
      },
      indentType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      eta:{
         type: DataTypes.STRING(50),
        allowNull: true,
      },
      remarks:{
         type: DataTypes.TEXT,
        allowNull: true,
      },
      enquiry_id:{
        type:DataTypes.INTEGER,
        allowNull:true
      }
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return PartsIndent;
}

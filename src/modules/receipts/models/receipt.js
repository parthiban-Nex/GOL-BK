export default function receiptdatas(sequelize, DataTypes) {
  const Receipt = sequelize.define(
    'receipt',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      doc_no: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      receipt_type: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      bill_type: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customer_code: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      old_dms_transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      countersale_number: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },

      jc_number: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      ref_no: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      ref_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tdsEntry: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      mode_of_payment: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      drawn_on: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      cheque_draft_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      cheque_draft_number: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      transaction_number: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      utr_bank_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      cardNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return Receipt;
}

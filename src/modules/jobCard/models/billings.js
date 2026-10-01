export default function BillingsData(sequelize, DataTypes) {
  const Billings = sequelize.define(
    'billings',
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
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jobcard_no: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      bill_no: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      bill_type: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      labor_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      labor_taxamount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      osl_labor_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      osllabor_taxamount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      parts_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      parts_taxamount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      foc_labor_bill_no: {
        type: DataTypes.STRING(30), //SEREXPINV-KMDU26-000001 
        allowNull: true,
      },
      foc_parts_bill_no: {
        type: DataTypes.STRING(30), //SEREXPINV-KMDU26-000001 
        allowNull: true, 
      },
      delivery_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      delivery_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
      foc_labor_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
       foc_parts_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      cess: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: 0,
      },
      cess_old: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      ins_invoice_no: {
        type: DataTypes.STRING(255),
        allowNull: true,
      }
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
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );
  return Billings;
}

export default function PurchaseOrderData(sequelize, DataTypes) {
  const PurchaseOrder = sequelize.define(
    'purchaseorder',
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
      
      po_number: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'po number is required',
          },
        },
      },
      valid_till_date: {
        type: DataTypes.STRING(),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Valid Till Date is required',
          },
        },
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        
      },
      vendor_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'VendorCode is required',
          },
        },
      },
      cancel_reason: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      
      status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1,
        comment: '1=open 2=approved 3=Partially Approved 4=cancelled 5=GRN Created 6=Partial GRN Created'
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
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'modifiedBy is required',
          },
        },
      },
      invoice_pdf_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
        invoice_pdf_signin_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return PurchaseOrder;
}

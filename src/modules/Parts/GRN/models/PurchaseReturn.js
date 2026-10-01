export default function PurchaseReturnsData(sequelize, DataTypes) {
    const PurchaseReturn = sequelize.define(
      'purchase_return',
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
        vendor_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notNull: { msg: 'VendorId is required' },
          },
        },
        document_type: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        grand_total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        grn_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Grn id is required',
            },
          },
        },
        grn_no: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'GrnNo is required',
            },
          },
        },
        purchase_return_invoice_number: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'InvoiceNumber is required',
            },
          },
        },
        purchase_return_date: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'purchase return date is required',
            },
          },
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
        vendor_name: {
            type: DataTypes.STRING(),
            allowNull: false,
            validate: {
              notNull: {
                msg: 'VendorName is required',
              },
            },
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
  
    return PurchaseReturn;
  }
  
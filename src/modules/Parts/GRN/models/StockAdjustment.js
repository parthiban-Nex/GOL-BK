export default function Stockadjustment(sequelize, DataTypes) {
    const stockadjustmentdata = sequelize.define(
      'stockadjustment',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        grn_id:{
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
              notNull: {
                msg: 'grn id is required',
              },
            }
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
        document_type: {
          type: DataTypes.STRING(),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'DocumentType is required',
            },
          },
        },
        grand_total:{
          type: DataTypes.DOUBLE,
          allowNull: false, // Mandatory
          validate: {
            notNull: {
              msg: 'Grand Total is required',
            },
          },
        },
        invoice_number: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'InvoiceNumber is required',
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
  
    return stockadjustmentdata;
  }
  
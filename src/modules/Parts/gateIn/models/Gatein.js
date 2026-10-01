export default function Gateindata(sequelize, DataTypes) {
  const Gatein = sequelize.define(
    'gatein',
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
      gatein_date_time:{
        type:DataTypes.STRING(),
        allowNull:false,
        validate: {
          notNull: {
            msg: 'Gate in Date Time is required',
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
      gatein_no: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'GrnNo is required',
          },
        },
      },
      invoice_number: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: {
          arg: true,
          msg: 'This Invoce No is already taken.',
        },

        validate: {
          notNull: {
            msg: 'InvoiceNumber is required',
          },
        },
      },
      invoice_date: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'InvoiceDate is required',
          },
        },
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        
      },
      po_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        
      },
      oracle_stocktransfer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        
      },
      erp_stock_transfer_id: {
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

      e_sugam_no: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      lr_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      lr_date: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      transport_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      invoice_pdf_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      frieght_charges: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      mis_charges: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      grand_total:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      invoice_amount:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
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
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'modifiedBy is required',
          },
        },
      },
    },
    {
      timestamps: true,
    }
  );

  return Gatein;
}

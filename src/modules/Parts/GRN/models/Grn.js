export default function Grns(sequelize, DataTypes) {
  const Grn = sequelize.define(
    'grn',
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
      document_type: {
        type: DataTypes.STRING(),
        allowNull: false,
        validate: {
          notNull: {
            msg: 'DocumentType is required',
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
      gatein_id: {
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
      frieght_charges: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      mis_charges: {
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

  return Grn;
}

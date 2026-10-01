export default function GrnParts(sequelize, DataTypes) {
  const GrnPart = sequelize.define(
    'grnpart',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      grn_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'GrnId is required',
          },
        },
      },

      poparts_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    
      gateinparts_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
       validate: {
          notNull: {
            msg: 'Item id is required',
          },
        },
      },
      item_code: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Item Code is required',
          },
        },
      },
      item_description: {
        type: DataTypes.STRING(250), // varchar(100)
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Item Description is required',
          },
        },
      },
      sup_invoice_quantity: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'SupInvoiceQuantity is required',
          },
        },
      },
      quantity: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Quantity is required',
          },
        },
      },
      rate: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Rate is required',
          },
        },
      },
      cost: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Cost is required',
          },
        },
      },
      mrp: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'MRP is required',
          },
        },
      },
      discount: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Discount is required',
          },
        },
      },
      po_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Not mandatory
      },
      
      binlocation: {
        type: DataTypes.INTEGER,
        allowNull: true, // Not mandatory
      },
      cgst: {
        type: DataTypes.DOUBLE,
        allowNull: true, // Not mandatory
      },
      sgst: {
        type: DataTypes.DOUBLE,
        allowNull: true, // Not mandatory
      },
      igst: {
        type: DataTypes.DOUBLE,
        allowNull: true, // Not mandatory
      },
      total: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Total is required',
          },
        },
      },
      old_grn_no: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
     old_grn_date: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return GrnPart;
}

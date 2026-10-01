export default function GrnStocks(sequelize, DataTypes) {
  const GrnStock = sequelize.define(
    'stocks',
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
      grn_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory
        references: {
          model: 'grns',
          key: 'id',
        },
        validate: {
          notNull: {
            msg: 'GrnId is required',
          },
        },
      },
      grn_parts_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'grnparts',
          key: 'id',
        },
        validate: {
          notNull: {
            msg: 'GrnPartsId is required',
          },
        },
      },
       discount: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },

      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
        
      },
      item_code: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'ItemCode is required',
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
      binlocation: {
        type: DataTypes.INTEGER,
        allowNull: false, // Not mandatory
        validate: {
          notNull: {
            msg: 'Bin Location is required',
          },
        },
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
      old_stocks_id:{
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      old_supplier_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      old_supplier_date: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

    },
    {
      timestamps: true,
    }
  );

  return GrnStock;
}

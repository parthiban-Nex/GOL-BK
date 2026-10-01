export default function PurchaseOrderPartsDatas(sequelize, DataTypes) {
  const PoPart = sequelize.define(
    'po_parts',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      po_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory 
        validate: {
          notNull: {
            msg: 'PO Id is required',
          },
        },
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'ItemId is required',
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
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Item Description is required',
          },
        },
      },
      hsncode: {
        type: DataTypes.STRING(),
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'hsncode is required',
          },
        },
      },
      make_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'MakeId is required',
          },
        },
      },
      model_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'ModelId is required',
          },
        },
      },
      part_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'PartCategoryId is required',
          },
        },
      },
      vin_number: {
        type: DataTypes.STRING(50), // varchar(100)
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Vin Number is required',
          },
        },
      },
      reg_no:{
        type: DataTypes.STRING(15), // varchar(100)
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Reg No is required',
          },
        },
      },
      jc_no:{
        type: DataTypes.STRING(20), // varchar(100)
        allowNull: true, // Not mandatory
      },
      jc_id:{
        type: DataTypes.INTEGER,
        allowNull: true, // Not mandatory
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
      back_order_quantity: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Back Order Quantity is required',
          },
        },
      },
      ETA:{
        type: DataTypes.STRING(),
        allowNull: true, // Not mandatory
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
      remarks: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: true, // Not mandatory
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: true, // Not mandatory
      },
    },
    {
      timestamps: true,
    }
  );

  return PoPart;
}

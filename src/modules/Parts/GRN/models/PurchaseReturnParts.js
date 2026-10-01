export default function PurchaseReturnParts(sequelize, DataTypes) {
    const PurchaseReturnPart = sequelize.define(
      'purchase_return_parts',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        purchase_return_id: {
          type: DataTypes.INTEGER,
          allowNull: false, // Mandatory
          references: {
            model: 'purchase_returns',
            key: 'id',
          },
          validate: {
            notNull: {
              msg: 'Purchase Return Id is required',
            },
          },
        },
        discount: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Discount is required',
            },
          },
        },
        item_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Item ID is required',
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
        quantity: {
          type: DataTypes.DOUBLE,
          allowNull: false, // Mandatory
          validate: {
            notNull: {
              msg: 'Quantity is required',
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
      },
      {
        timestamps: true,
      }
    );
  
    return PurchaseReturnPart;
  }
  
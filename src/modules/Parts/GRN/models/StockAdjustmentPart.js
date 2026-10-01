export default function StockAdjustmentParts(sequelize, DataTypes) {
    const StockdjustmentPartData = sequelize.define(
      'stockadjustment_part',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        stock_adj_id: {
          type: DataTypes.INTEGER,
          allowNull: false, // Mandatory
          validate: {
            notNull: {
              msg: 'stock_adj_id is required',
            },
          },
        },
        grnparts_id:{
            type: DataTypes.INTEGER,
            allowNull: false, // Mandatory
            validate: {
              notNull: {
                msg: 'Grnparts is required',
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
  
    return StockdjustmentPartData;
  }
  
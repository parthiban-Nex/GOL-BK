export default function Countersalepartdatas(sequelize, DataTypes) {
    const CounterSaleParts = sequelize.define(
      'countersale_parts',
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
        counter_sale_id: {
          type: DataTypes.INTEGER(),
          allowNull: true,
        },
        item_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        item_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        item_description: {
          type: DataTypes.STRING(250),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        return_quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
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
          type: DataTypes.DOUBLE(20, 2),
          allowNull: true,
          defaultValue: 0.0,
        },
        discount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        sgst: {
          type: DataTypes.DOUBLE(20, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        cgst: {
          type: DataTypes.DOUBLE(20, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        igst: {
          type: DataTypes.DOUBLE(20, 2),
          allowNull: false,
          defaultValue: 0.0,
        },
        hsn_code: {
          type: DataTypes.STRING(50),
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
      },
      {
        timestamps: true,
      }
    );
  
    return CounterSaleParts;
  }
  
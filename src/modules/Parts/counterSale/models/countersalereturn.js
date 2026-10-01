export default function Countersalesreturndata(sequelize, DataTypes) {
    const Countersale = sequelize.define(
      'countersalereturn',
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
        customer_id: {
          type: DataTypes.STRING(30),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'customer id is required',
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
        counter_sale_invoice_number: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
              notNull: {
                msg: 'InvoiceNumber is required',
              },
            },
          },
          counter_sale_id:{
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
              notNull: {
                msg: 'counter sale id is required',
              },
            },
          },
        customer_code: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Customer Code is required',
            },
          },
        },
        
        grand_total: {
          type: DataTypes.DOUBLE,
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
  
    return Countersale;
  }
  
export default function Countersales(sequelize, DataTypes) {
    const Countersale = sequelize.define(
      'countersale',
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
        customer_code: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Customer Code is required',
            },
          },
        },
        customer_name: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Customer Name is required',
            },
          },
        },
        customer_address: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Customer address is required',
            },
          },
        },
        shipping_address: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Shipping address is required',
            },
          },
        },
  
        customer_state: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        customer_city: {
          type: DataTypes.STRING(),
          allowNull: true,
        },
  
        customer_gstin: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        source: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        source_type: {
          type: DataTypes.STRING(),
          allowNull: true,
        },
        grand_total: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        customer_type:{
            type: DataTypes.STRING(),
            allowNull: true,
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 2,
          comment: '2=issued, 1=returned'
        },
        gatepass_invoice_no:{
          type: DataTypes.STRING(),
          allowNull: true,
        },
        gatepass_status:{
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 2,
          comment: '2=not generated, 1=generated'
        },
        gatepass_checkout_time:{
          type: DataTypes.STRING(),
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
  
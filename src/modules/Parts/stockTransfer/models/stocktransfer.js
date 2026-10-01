export default function stocktransferdata(sequelize, DataTypes) {
    const Stocktransfer = sequelize.define(
      'stocktransfers',
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
        to_outlet_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        to_warehouse_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          
        },
        to_warehouse_code: {
          type: DataTypes.STRING(),
          allowNull: true,
        },
        outlet_code: {
          type: DataTypes.STRING(),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'Outlet code is required',
            },
          },
        },
        to_outlet_code: {
          type: DataTypes.STRING(),
          allowNull: true,
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
        invoice_number: {
          type: DataTypes.STRING(),
          allowNull: false,
          validate: {
            notNull: {
              msg: 'invoice number is required',
            },
          },
        },
        
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 2,
          },
          approve_date: {
            type: DataTypes.STRING(),
            allowNull: true,
          },
        
        
        grand_total: {
          type: DataTypes.DOUBLE,
          allowNull: true,
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
  
    return Stocktransfer;
  }
  
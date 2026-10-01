export default function GateinPartsBinlocationsData(sequelize, DataTypes) {
    const GateInPartBinLocation = sequelize.define(
      'gateinpartsbinlocations',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        gatein_parts_id: {
          type: DataTypes.INTEGER,
          allowNull: true, // Mandatory
        },
  
        stocks_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        grn_parts_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
  
        item_id: {
          type: DataTypes.INTEGER,
          allowNull: true
          
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
        
        quantity: {
          type: DataTypes.DOUBLE,
          allowNull: false, // Mandatory
          validate: {
            notNull: {
              msg: 'Quantity is required',
            },
          },
        },
        
        binLocation: {
          type: DataTypes.STRING(),
          allowNull: true, // Not mandatory
        },
       
      },
      {
        timestamps: true,
      }
    );
  
    return GateInPartBinLocation;
  }
  
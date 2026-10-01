export default function CounterSaleReturnlogdatas(sequelize, DataTypes) {

    const StockReturnlog = sequelize.define("countersale_return_log", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
       
        countersale_part_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
      
        stock_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
       
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
       
      
    },
        {
            timestamps: true,
           
        })

    return StockReturnlog

}

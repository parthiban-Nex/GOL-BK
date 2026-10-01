export default function StockReturnlogdatas(sequelize, DataTypes) {

    const StockReturnlog = sequelize.define("stocks_return_log", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
       
        issue_id: {
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

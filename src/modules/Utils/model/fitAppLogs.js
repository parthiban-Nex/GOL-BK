export default function VrmTransFitAppData(sequelize, DataTypes) {
    const VrmTransFitAppData = sequelize.define('vrm_trans_fit_app_data', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        api: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        type: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        payload: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        response: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        created_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        created_by: {
            type: DataTypes.STRING(45),
            allowNull: true
        }
    }, {
        tableName: 'vrm_trans_fit_app_data',
        timestamps: false
    });

    return VrmTransFitAppData;
}

export default function nmsadropdownmasterdatas(sequelize, DataTypes) {
    const nmsadropdownmaster = sequelize.define(
        'nmsa_dropdown_masters',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            value: {
                type: DataTypes.STRING(250),
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            updatedBy: {
                type: DataTypes.INTEGER,
            },
        },
        {
            timestamps: true,
            createdAt: 'created_at',  
            updatedAt: 'updated_at',         
        }
    );

    return nmsadropdownmaster;
}

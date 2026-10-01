export default function BatteryDetails(sequelize, DataTypes) {
 const batteryDetails = sequelize.define(
    'vrm_trans_battery_tyre_details',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
       VISIT_ID: {
        type: DataTypes.STRING(100),
        allowNull: false,
        notEmpty: true,
        primaryKey: true,
        validate: {
          notNull: {
            msg: 'VisitId is required',
          },
        },
      },
      BATTERY_MAKE: {
        type: DataTypes.STRING(100)
      },
      BATTERY_VOLTAGE: {
        type: DataTypes.STRING(100)
      },
      TYRE_MAKE: {
        type: DataTypes.STRING(100)
      },      
      TYRE_SIZE: {
        type: DataTypes.STRING(100)
      },      
      FL_TREAD: {
        type: DataTypes.STRING(100)
      },
      FR_TREAD: {
        type: DataTypes.STRING(100)
      },  
      RL_TREAD: {
        type: DataTypes.STRING(100)
      },
      RR_TREAD: {
        type: DataTypes.STRING(100)
      },
      CREATED_BY: {
        type: DataTypes.STRING(100),
      },
      UPDATED_BY: {
        type: DataTypes.STRING(100),
      },
    },
    {
      timestamps: true,
      updatedAt: 'updatedAt',
      indexes: [
        {
          unique: true,
          fields: ['VISIT_ID'],  // composite unique
        },
      ],
    },
    
  );

  return batteryDetails;
}
export default function CarpmWebHookRecords(sequelize, DataTypes) {
 const carpmWebHookRecords = sequelize.define(
    'vrm_trans_carpm_webhook_updates',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      FUNCTION_TYPE: {
        type: DataTypes.STRING(45)
      },
      FUNCTION_ID: {
        type: DataTypes.INTEGER
      },
      JOB_ID: {
        type: DataTypes.INTEGER
      },
      URL: {
        type: DataTypes.STRING(5000)
      },
      MECHANIC_EMAIL: {
        type: DataTypes.STRING(1000)
      },
      LICENSE_PLATE: {
        type: DataTypes.STRING(45)
      },
      CREATED_DATE: {
        type: DataTypes.DATE
      },
    },
    {
      timestamps: false,
    },
    
  );

  return carpmWebHookRecords;
}
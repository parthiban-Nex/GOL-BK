export default function vehicleFLADatas(sequelize, DataTypes) {
  const VehicleFLA = sequelize.define(
    'VRM_TRANS_FLA_DATA',
    {
      VEHICLE_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      ACCESS_TOKEN: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_REGISTRATION_NUMBER: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      VEHICLE_STATE_CODE: {
        type: DataTypes.STRING(3),
        allowNull: true,
      },
      VEHICLE_RTO_CODE: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      VEHICLE_RTO_NAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_CHASI_NO: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      VEHICLE_ENGINE_NO: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      VEHICLE_REGISTERED_DATE: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      VEHICLE_AGE: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      VEHICLE_PURCHASE_DATE: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      VEHICLE_CLASS_DESCRIPTION: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      VEHICLE_OWNER_SR: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      VEHICLE_PUCC_NO: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      VEHICLE_PERMANENT_ADDRESS: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      VEHICLE_CURRENT_ADDRESS: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      VEHICLE_MAKE: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_MODEL: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_COLOR: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      VEHICLE_FUEL_TYPE: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      VEHICLE_CUBIC_CAPACITY: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_MANUFACTURE_YEAR: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      VEHICLE_SEAT_CAPACITY: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      VEHICLE_FLA_RTO_GEO: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_BLACKLIST_FLAG: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      VEHICLE_BLACKLIST_STATUS: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_FIT_UPTO: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_MANUFACTURE_MONTH_YEAR: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      VEHICLE_NOC_DETAILS: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_PERMIT_ISSUE_DATE: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_PERMIT_NUMBER: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_PERMIT_TYPE: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_COMMERCIAL_FLAG: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      VEHICLE_PERMIT_VALID_FROM: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_PERMIT_VALID_UPTO: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      VEHICLE_PUCC_UPTO: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      VEHICLE_REGISTERED_AT: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      VEHICLE_TAX_UPTO: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      VEHICLE_FATHER_NAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VEHICLE_OWNER_NAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      HYPTH_FNCR_NAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      HYPTH_PUCC_NO: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      INSURANCE_POLICY_NUMBER: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      INSURANCE_ISEXPIRED: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      INSURANCE_COMPANY: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      INSURANCE_PUCC_NO: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      INSURANCE_EXPIRY_DATE: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      CREATED_AT: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      UPDATED_AT: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false, // Because CREATED_AT and UPDATED_AT are manually defined
      tableName: 'VRM_TRANS_FLA_DATA',
      charset: 'utf8',
    }
  );

  return VehicleFLA;
}

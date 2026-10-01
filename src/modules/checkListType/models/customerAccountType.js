export default function customerAccountTypeDatas(sequelize, DataTypes) {
  const CustomerAccountType = sequelize.define(
    'vrm_master_customer_account_type',
    {
      CUSTOMER_ACCOUNT_TYPE_ID: {
        type: DataTypes.STRING(45),
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      CUSTOMER_ACCOUNT_TYPE_DES: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return CustomerAccountType;
}

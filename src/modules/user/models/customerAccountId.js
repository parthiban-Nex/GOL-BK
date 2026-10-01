export default function MasterCustomerAccount(sequelize, DataTypes) {
const MasterCustomerAccount = sequelize.define(
    'vrm_master_customer_account',
    {
      CUSTOMER_ACCOUNT_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },

      CUSTOMER_ACCOUNT_TYPE: {
        type: DataTypes.STRING(45),
        allowNull: false
      },

      CUSTOMER_NAME: {
        type: DataTypes.STRING(150),
        allowNull: true
      },

      CUSTOMER_ADDRESS: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      CUSTOMER_CITY: {
        type: DataTypes.STRING(128),
        allowNull: true
      },

      CUSTOMER_STATE: {
        type: DataTypes.STRING(128),
        allowNull: true
      },

      CUSTOMER_POC: {
        type: DataTypes.STRING(128),
        allowNull: true
      },

      CUSTOMER_POC_PHONE: {
        type: DataTypes.STRING(128),
        allowNull: true
      },

      CUSTOMER_POC_EMAIL: {
        type: DataTypes.STRING(128),
        allowNull: true
      },

      ACTIVE: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 1
      },

      CREATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true
      },

      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true
      },

      UPDATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true
      },

      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'VRM_MASTER_CUSTOMER_ACCOUNT',
      timestamps: false,        // because DB has its own date fields
      freezeTableName: true
    }
  );

  return MasterCustomerAccount;
}

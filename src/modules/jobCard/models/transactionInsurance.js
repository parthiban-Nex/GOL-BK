export default function transactionInsurancedatas(sequelize, DataTypes) {
  const TransactionInsurance = sequelize.define(
    'transaction_insurance',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      insurance_provider_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      insurance_provider_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      insurance_state: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      insurance_city: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      insurance_pincode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      insurance_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      
      insurance_area_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      gstin_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      policy_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      policy_exp_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      claim_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      surveyor_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      surveyor_mob: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      idv_value: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      surveyor_email: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      surveyor_intimate_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      surveyor_proposed_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      surveyor_visited_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estimated_cost: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      surveyor_approved_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
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
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return TransactionInsurance;
}

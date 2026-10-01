export default function psfreviewlogsdatas(sequelize, DataTypes) {
    const psfreviewlog = sequelize.define(
      'psf_review_logs',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_satification: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    psf_review_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
   
    phone_call_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customer_complaint_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    psf_disposition: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    psf_sub_disposition: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    followup_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    psf_agent_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
    
        
      },
      {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
      }
    );
  
    return psfreviewlog;
  }
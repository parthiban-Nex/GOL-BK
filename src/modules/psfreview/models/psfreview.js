export default function psfreviewdatas(sequelize, DataTypes) {
    const psfreview = sequelize.define(
      'psf_reviews',
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
    complaint_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
   
    phone_call_notes: {
      type: DataTypes.STRING(500),
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
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
        
      },
      {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
      }
    );
  
    return psfreview;
  }
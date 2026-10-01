export default function customerfeedbackdatas(sequelize, DataTypes) {
    const customerfeedback = sequelize.define(
      'customer_feedbacks',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    psf_review_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    psf_review_log_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ratings: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
        
      },
      {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
      }
    );
  
    return customerfeedback;
  }
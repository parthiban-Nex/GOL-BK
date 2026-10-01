export default function feedbackdatas(sequelize, DataTypes) {
    const Feedback = sequelize.define(
      'feedback_questions',
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        question: {
          type: DataTypes.STRING(250),
          allowNull: false,
        },
       
        status: {
          type: DataTypes.BOOLEAN,
          defaultValue: 1,
          allowNull: false,
        },
      },
      {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
      }
    );
  
    return Feedback;
  }
export default function jobCardComplaintAdviceData(sequelize, DataTypes) {
  return sequelize.define(
    'jobcard_customer_complaint_advice',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      transaction_id: { type: DataTypes.INTEGER, allowNull: false },
      customer_complaint: { type: DataTypes.TEXT, allowNull: false },
      service_advice: { type: DataTypes.TEXT, allowNull: true },
      attended: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { freezeTableName: true, timestamps: false }
  );
}

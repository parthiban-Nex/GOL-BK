export default function customercomplaintdatas(sequelize, DataTypes) {

const CustomerComplaint = sequelize.define('customer_complaints', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    branch_id: DataTypes.INTEGER,
    vehicle_reg_no: DataTypes.STRING,
    emp_id: DataTypes.INTEGER,
    make: DataTypes.STRING,
    model: DataTypes.STRING,
    job_type: DataTypes.STRING,
    complaint_no: DataTypes.STRING,
    complaint_against_job_card_no: DataTypes.STRING,
    complaint_against_job_card_id: DataTypes.INTEGER,
    repair_type: DataTypes.INTEGER,
    service_type: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    source_type: DataTypes.INTEGER,
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    vanumber: DataTypes.STRING,
    complaint_id: DataTypes.STRING,
    customer_name: DataTypes.STRING,
    customer_mobile: DataTypes.STRING,
    customer_email: DataTypes.STRING,
    address: DataTypes.STRING,
    state_id: DataTypes.INTEGER,
    citie_id: DataTypes.INTEGER,
    pincode: DataTypes.INTEGER,
    reason: DataTypes.TEXT,
    phone_call_notes: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    vehicle_id: DataTypes.INTEGER,
    next_follow_up: {
      type: DataTypes.STRING,
      allowNull: true
    },
    complaint_rescheduled_date: {
      type: DataTypes.STRING,
      allowNull: true
    },
    disposition_id: DataTypes.INTEGER,
    disposition_name: DataTypes.STRING,
    source_of_complaint: DataTypes.INTEGER,
    source_of_complaint_upload: DataTypes.STRING,
    complaint_upload: DataTypes.STRING,
    agent_name: DataTypes.STRING
  }, {
    timestamps: true,
  });

  return CustomerComplaint;
}
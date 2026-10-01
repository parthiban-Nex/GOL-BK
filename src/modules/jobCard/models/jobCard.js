import commonLogic from '../../../shared/commonLogics.js';

export default function JobCarddatas(sequelize, DataTypes) {
  const JobCard = sequelize.define(
    'transactions',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      document_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customer_code: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      customer_name: {
        type: DataTypes.STRING(250),
        allowNull: false,
        set(value) {
          this.setDataValue('customer_name', commonLogic.encrypt(value));
        },
        get() {
          const encryptedValue = this.getDataValue('customer_name');
          return encryptedValue ? commonLogic.decrypt(encryptedValue) : null;
        },
      },
      customer_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      customer_state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      customer_city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      customer_pincode: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customer_type: {
        type: DataTypes.STRING(50),
        allowNull: true, //false
      },
      customer_gstin: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      customer_mobileNumber: {
        type: DataTypes.STRING(250),
        allowNull: true,
        set(value) {
          this.setDataValue('customer_mobileNumber', commonLogic.encrypt(value));
        },
        get() {
          const encryptedValue = this.getDataValue('customer_mobileNumber');
          return encryptedValue ? commonLogic.decrypt(encryptedValue) : null;
        },
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reg_no: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      job_card_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      work_end_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      customer_arrived_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      repair_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      service_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      odometer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      service_booking_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      fit_status: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      status_value: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      assigned_tech_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      assigned_sa_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      fuel_level: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      fuel_level_percentage: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
      },
      clickin_inspection_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      service_estimate_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      service_estimate_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      dropoff_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null,
      },
      driver_status: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: null,
      },
      customer_voice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      service_engineer_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      service_advice: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      source: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      source_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dsa_agent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dsa_agent: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      part_approve: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      credit_approve: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      credit_approve_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      otd_reason_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      otd_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sub_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      sub_status_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      outlet_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      paid_by_status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      stageNorms: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      axle: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      application: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      nextDueDateFC: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      engineOilCapacity: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      customer_email: {
        type: DataTypes.STRING(250),
        allowNull: true,
        set(value) {
          this.setDataValue('customer_email', commonLogic.encrypt(value));
        },
        get() {
          const encryptedValue = this.getDataValue('customer_email');
          return encryptedValue ? commonLogic.decrypt(encryptedValue) : null;
        },
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
      health_report_link: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      inspectionStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      initialInspectionStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerApprove: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      jobType: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      per_day_km: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      insuranceName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      insuranceExpDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    gatepassApprove: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
      vehicle_monthly_usage: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return JobCard;
}

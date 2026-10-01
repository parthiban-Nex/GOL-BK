export default function oslScheduledatas(sequelize, DataTypes) {
  const OslSchedules = sequelize.define(
    'osl_schedules',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rot_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rot_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      singleAmount: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      amount: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      additionalMargin: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      discount_percentage: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      sgst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      cgst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      igst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      depreciation_per: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      customer_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      insurance_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      laborTotal: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      marginPercentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      osl_bill_no: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: '0',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
      // created_date: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      //   defaultValue: DataTypes.NOW,
      //   field: 'created_date',
      // },
      // updated_Date: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      //   field: 'updated_Date',
      // },
      fitId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approveDatetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvalStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        field: 'approval_status',
      },
      sourceType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'JOB_CARD',
        field: 'source_type',
      },
      sourceEstimateItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'source_estimate_item_id',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return OslSchedules;
}

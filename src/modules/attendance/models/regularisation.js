export default function regularisationdatas(sequelize, DataTypes) {
  const Regularisation = sequelize.define(
    'attendanceRegularisation',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      employeeId: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      employeeName: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      outletId: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Forgot Punch',
        comment: 'Forgot Punch, Wrong Punch, System Error, Missed Punch',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachmentUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
        comment: 'Pending, Approved, Rejected',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      indexes: [
        {
          fields: ['status'],
          name: 'idx_regularisation_status',
        },
        {
          fields: ['employeeId'],
          name: 'idx_regularisation_employee',
        },
      ],
    }
  );

  return Regularisation;
}

export default function attendancedatas(sequelize, DataTypes) {
  const Attendance = sequelize.define(
    'attendance',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      employeeId: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      employeeName: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      employeeRole: {
        type: DataTypes.STRING(100),
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
      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'P',
        comment: 'P: Present, A: Absent, L: Leave, DR: Duty Rest, OD: On Duty, H: Holiday, W: Weekend',
      },
      shift: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: '1st Shift',
      },
      manager: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      checkIn: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      checkOut: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
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
          unique: true,
          fields: ['employeeId', 'date'],
          name: 'unique_employee_date',
        },
        {
          fields: ['date'],
          name: 'idx_attendance_date',
        },
        {
          fields: ['outletId'],
          name: 'idx_attendance_outlet',
        },
      ],
    }
  );

  return Attendance;
}

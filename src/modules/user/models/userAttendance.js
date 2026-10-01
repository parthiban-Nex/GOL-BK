export default function userattendancedatas(sequelize, DataTypes) {
  const UserAttendance = sequelize.define(
    'vrm_trans_user_attendance',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      USER_ID: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      STATUS: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      LATITUDE: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      LONGITUDE: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      ADDRESS: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRESENTDATE: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      CREATED_BY: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      CREATED_DATE: true,
      UPDATED_DATE: true,
    },
    
  );

  return UserAttendance;
}

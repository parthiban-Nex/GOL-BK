export default function CarpmRecords(sequelize, DataTypes) {
 const carpmRecords = sequelize.define(
    'vrm_trans_carpm_records',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
       VISIT_ID: {
        type: DataTypes.STRING(100),
        allowNull: false,
        notEmpty: true,
        primaryKey: true,
        validate: {
          notNull: {
            msg: 'VisitId is required',
          },
        },
      },
      REPORT_ID: {
        type: DataTypes.STRING(100)
      },
      REPORT_TYPE: {
        type: DataTypes.STRING(100)
      },
      REPORT_DATA: {
        type: DataTypes.TEXT('long')
      },
      IS_SUCCESS: {
        type: DataTypes.TEXT
      },
      CREATED_BY: {
        type: DataTypes.STRING(100)
      },
      UPDATED_BY: {
        type: DataTypes.STRING(100)
      },
    },
    {
      timestamps: true,
      updatedAt: 'updatedAt',
    },
    
  );

  return carpmRecords;
}
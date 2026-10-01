export default function PreReasons(sequelize, DataTypes) {
 const preReasons = sequelize.define(
    'vrm_trans_pre_inspection_reasons',
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
      INSPECTION_TYPE: {
        type: DataTypes.STRING(100)
      },
      CHECKLIST_TYPE_CODE: {
        type: DataTypes.STRING(100)
      },
      CHECKLIST_VERSION: {
        type: DataTypes.STRING(100)
      },
      PARAM_CHECKLIST_ID: {
        type: DataTypes.STRING(100)
      },
      RATING_CHECKLIST_ID: {
        type: DataTypes.STRING(100)
      },
      RATING_REASON_REMARKS: {
        type: DataTypes.TEXT
      },
      MEASUREMENT_READING: {
        type: DataTypes.STRING(100)
      },
      CREATED_BY: {
        type: DataTypes.STRING(100),
      },
      UPDATED_BY: {
        type: DataTypes.STRING(100),
      },
    },
    {
      timestamps: true,
      updatedAt: 'updatedAt',
      indexes: [
        {
            name: 'uniq_visit_param_reason',  // <-- custom short name
            unique: true,
            fields: ['VISIT_ID','PARAM_CHECKLIST_ID', 'RATING_CHECKLIST_ID'],  // composite unique
        },
      ],
    },
    
  );

  return preReasons;
}
export default function inspectionRatingReasonDatas(sequelize, DataTypes) {
  const InspectionRatingReason = sequelize.define(
    'vrm_master_inspection_rating_reason',
    {
      UNIQUE_RATING_REASON_ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      INSPECTION_TYPE: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CHECKLIST_TYPE_CODE: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CHECKLIST_VERSION: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
      PARAM_CODE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      RATING_REASON_CODE: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      RATING_REASON_DESC: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      REASON_CRITICALITY: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ACTIVE: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'CREATED_DATE',
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_DATE',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return InspectionRatingReason;
}

export default function inspectionCheckListDatas(sequelize, DataTypes) {
  const InspectionCheckList = sequelize.define(
    'vrm_master_inspection_checklist',
    {
      UNIQUE_PARAM_ID: {
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
      PARAM_NAME: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      RELATIVE_RANKING: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      PARAM_WEIGHT: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      SUB_SYSTEM_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      OPTIONAL: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      SORT_ORDER: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      VALUE_REQUIRED: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
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

  return InspectionCheckList;
}

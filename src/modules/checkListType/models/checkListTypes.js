export default function checkListTypeDatas(sequelize, DataTypes) {
  const CheckListTypes = sequelize.define(
    'vrm_master_checklist_type',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      CHECKLIST_TYPE_CODE: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: '',
        primaryKey: true,
      },
      CHECKLIST_TYPE: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      CHECKLIST_TYPE_CATEGORY: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      CUSTOMER_ACCOUNT_TYPE_ID: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      ACTIVE: {
        type: DataTypes.BOOLEAN(1),
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

  return CheckListTypes;
}

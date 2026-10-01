export default function SaveCheckListTypeDatas(sequelize, DataTypes) {
  const SaveCheckListType= sequelize.define(
    'vrm_trans_customer_visit_checklist',
    {
      CUSTOMER_VISIT_CHECKLIST_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      VISIT_ID: {
        type: DataTypes.STRING(45),
      },
      CHECKLIST_TYPE_CODE: {
        type: DataTypes.STRING(45),
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return SaveCheckListType;
}

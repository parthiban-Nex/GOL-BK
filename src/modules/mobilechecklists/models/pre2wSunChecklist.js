export default function pre2wSunCheckList(sequelize, DataTypes) {
 const pre2wSunCheckList = sequelize.define(
    'vrm_trans_pre_2w_sun_checklists',
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
      CHECKLIST_ID: {
        type: DataTypes.STRING(100)
      },
      CONTENTS: {
        type: DataTypes.TEXT
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
          unique: true,
          name: 'uniq_visitid_checklistid',  // custom short name
          fields: ['VISIT_ID', 'CHECKLIST_ID'],  // composite unique
        },
      ],
    },
    
  );

  return pre2wSunCheckList;
}
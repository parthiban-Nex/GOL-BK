export default function SavePDCDentAndScratchDatas(sequelize, DataTypes) {
  const SavePDCDentAndScratch = sequelize.define(
    'vrm_trans_pdc_dent_scratch',
    {
      DENT_SCRATCH_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      VISIT_ID: {
        type: DataTypes.INTEGER,
      },
      X_POINT: {
        type: DataTypes.STRING(128),
      },
      Y_POINT: {
        type: DataTypes.STRING(64),
      },
      TYPE: {
        type: DataTypes.STRING(64),
      },
      COLOR_HEX: {
        type: DataTypes.STRING(64),
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return SavePDCDentAndScratch;
}

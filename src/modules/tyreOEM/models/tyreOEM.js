export default function tyreOemDatas(sequelize, DataTypes) {
  const TyreOem = sequelize.define(
    'vrm_master_tyre_oem',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      OEM_NAME: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        field: 'CREATED_DATE',
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_DATE',
      },
      STATUS: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return TyreOem;
}

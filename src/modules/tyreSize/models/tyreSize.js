export default function tyreSizeDatas(sequelize, DataTypes) {
  const TyreSize = sequelize.define(
    'vrm_master_tyre_size',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      TYRE_SIZE: {
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

  return TyreSize;
}

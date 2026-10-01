export default function inputTypeDatas(sequelize, DataTypes) {
  const InputTypes = sequelize.define(
    'vrm_master_input_type',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      NAME: {
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
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return InputTypes;
}

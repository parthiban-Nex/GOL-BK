export default function OutletSettings(sequelize, DataTypes) {
  const OuteletSettings = sequelize.define(
    'vrm_master_outlet_settings',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      OUTLET_ID: {
        type: DataTypes.STRING(45),
      },
      CONFIG: {
        type: DataTypes.STRING(45),
      },
       VALUE: {
        type: DataTypes.STRING(45),
      },
      CREATED_BY: {
        type: DataTypes.STRING(45),
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(45),
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
      },

    },
    {
      timestamps: false,
    }
  );

  return OuteletSettings;
}

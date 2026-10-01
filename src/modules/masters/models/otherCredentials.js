export default function OtherCredentialsSettings(sequelize, DataTypes) {
  const OtherCredentialsSettings = sequelize.define(
    'vrm_master_other_credentials',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      TYPE: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      AUTHTOKEN: {
        type: DataTypes.STRING(4000),
        allowNull: false,
      },
      TOKEN_TYPE: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      EXPIRE_TIME: {
        type: DataTypes.DATE,
      },
      CREATED_BY: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
      },
      UPDATED_BY: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
      },
    },
    {
      timestamps: false,
    }
  );

  return OtherCredentialsSettings;
}

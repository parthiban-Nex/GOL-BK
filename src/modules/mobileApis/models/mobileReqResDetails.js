export default function MobileApiTrackData(sequelize, DataTypes) {
  const MobileApiTrack = sequelize.define(
    'mobile_api_track',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, 
      },

      user_role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      api_url: {
        type: DataTypes.STRING, 
        allowNull: false,
      },

      action: {
        type: DataTypes.STRING, 
        allowNull: false,
      },

      request_json: {
        type: DataTypes.TEXT, 
        allowNull: true,
      },

      response_json: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'mobile_api_track',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return MobileApiTrack;
}

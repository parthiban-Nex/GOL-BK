export default function commonlogdatas(sequelize, DataTypes) {
  const CommonLog = sequelize.define(
    'commonlog',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      request: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      response: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      action: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },

      method: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },

      url: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      header: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      updatedBy: {
        type: DataTypes.INTEGER,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return CommonLog;
}

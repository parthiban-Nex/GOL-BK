export default function scheduleMechanicMappingdatas(sequelize, DataTypes) {
  const mechanicMapping = sequelize.define(
    'schedule_mechanics',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rot_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      labour_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      mechanic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mechanic_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      percentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      start_time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      status_value: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      mechanic_hrs: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.INTEGER,
      },
      stdhrs: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return mechanicMapping;
}

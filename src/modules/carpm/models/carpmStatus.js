export default function carpmstatusdata(sequelize, DataTypes) {
  const CarpmStatus = sequelize.define(
    'vrm_trans_carpm_status',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      visit_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      created_at : true,
      created_by : true
    },
    
  );

  return CarpmStatus;
}

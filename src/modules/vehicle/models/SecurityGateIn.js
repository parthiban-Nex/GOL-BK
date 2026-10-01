export default function securityGateIn(sequelize, DataTypes) {
  const securityGateIn = sequelize.define(
    'vrm_trans_security_gatein',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      visit_id: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      vehicle_reg_no: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      vehicle_km_reading : {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      vehicle_make_id:{
        type: DataTypes.STRING(45),
        allowNull: true
      },
      vehicle_model_id:{
        type: DataTypes.STRING(45),
        allowNull: true          
      },
      gate_out_type:{
        type: DataTypes.STRING(45),
        allowNull: true
      },
      pick_up_by:{
        type: DataTypes.STRING(45),
        allowNull: true
      },
      assigned_sa:{
        type: DataTypes.STRING(45),
        allowNull: true
      },
      active:{
        type: DataTypes.STRING(45),
        allowNull: true
      },
      updated_by:{
        type: DataTypes.STRING(45),
        allowNull: true
      },
      created_by: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return securityGateIn;
}

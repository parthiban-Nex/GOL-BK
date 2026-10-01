export default function securityGateOut(sequelize, DataTypes) {
  const securityGateOut = sequelize.define(
    'vrm_trans_security_gateout',
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
        allowNull: false
      },
      gate_out_type:{
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

  return securityGateOut;
}

export default function monthlytargetdatas(sequelize, DataTypes) {
  const MonthlyTarget = sequelize.define(
    'monthly_targets',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      target_in_flow_rjc: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      target_in_flow_ajc: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      target_billed_rjc: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      target_billed_ajc: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      target_labours_to_rjc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      target_labours_to_ajc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      target_parts_to_rjc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      target_parts_to_ajc: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_role: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
      }
    },
    {
      timestamps: true,
      createdAt: 'createdAt',  
      updatedAt: 'updatedAt',         
    }
  );

  return MonthlyTarget; 
}

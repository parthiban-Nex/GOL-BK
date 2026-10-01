export default function beatactivitydatas(sequelize, DataTypes) {
  const beatActivityMapping = sequelize.define(
    'beatactivitymaps',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      beatPlanId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      activityPlanId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      franchiseId: {
      type: DataTypes.INTEGER,
      allowNull: true
      },
      beatPlanUpdateFranchiseId: {
      type: DataTypes.INTEGER,
      allowNull: true
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return beatActivityMapping;
}

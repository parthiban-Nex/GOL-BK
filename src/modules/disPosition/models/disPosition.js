export default function dispositiondatas(sequelize, DataTypes) {
  const DisPosition = sequelize.define(
    'disposition',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      disPositionCode: {
        type: DataTypes.STRING(25),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'code is required',
          },
          notEmpty: {
            msg: 'code is not empty',
          },
        },
      },
      disPositionType: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
      },
      customer_satisfaction: {
        type:DataTypes.INTEGER,
        allowNull: true,
      
      },
      psf_status: {
        type:DataTypes.INTEGER,
        allowNull: true,
      
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

  return DisPosition;
}

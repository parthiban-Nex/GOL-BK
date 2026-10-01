export default function gmsTokendatas(sequelize, DataTypes) {
  const gmsToken = sequelize.define(
    'gms_token',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      
      user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'user_id is required',
          },
        },
      },
      token: {
        type: DataTypes.TEXT,
      },
      expire_at: {
        type: DataTypes.DATE,
      },
      type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    },
    
  );

  return gmsToken;
}
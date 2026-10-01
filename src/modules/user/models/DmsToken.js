export default function dmsTokendatas(sequelize, DataTypes) {
  const dmsToken = sequelize.define(
    'dms_token',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      
      outlet_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'outlet code is required',
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

  return dmsToken;
}
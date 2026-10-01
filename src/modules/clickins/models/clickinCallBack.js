export default function ClickinsCallback(sequelize, DataTypes) {
  const ClickinsCallback = sequelize.define(
    'vrm_trans_clikins_callback',
    {
      ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      CONTENT: {
        type: DataTypes.TEXT('long'),
        allowNull: false
      },
      VISIT_ID: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      INSPECTION_ID: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      CREATED_BY: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false
      },
      UPDATED_BY: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
    timestamps: false
  });

  return ClickinsCallback;
}

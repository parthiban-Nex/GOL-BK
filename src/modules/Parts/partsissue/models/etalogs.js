export default function Etalogdatas(sequelize, DataTypes) {
  const Etalogs = sequelize.define(
    'eta_log',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      indent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      eta: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      remarks:{
        type:DataTypes.STRING(100)
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'createdBy is required',
          },
        },
      },
    },
    {
      timestamps: true,
    }
  );

  return Etalogs;
}

export default function passwordhistorydatas(sequelize, DataTypes) {
  const PasswordHistory = sequelize.define(
    'password_history',
    { 
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },    

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'password_history',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );


  return PasswordHistory;
};

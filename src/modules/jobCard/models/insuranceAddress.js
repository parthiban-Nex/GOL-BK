export default function insuranceAddressdatas(sequelize, DataTypes) {
  const InsuranceAddress = sequelize.define(
    'insurance_addresses',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      insuranceProviderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      insuranceProviderName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gstin: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      pincode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
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
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return InsuranceAddress;
}

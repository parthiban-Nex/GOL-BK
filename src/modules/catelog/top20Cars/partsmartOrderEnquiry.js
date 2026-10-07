export default function partsmartOrderEnquiryDatas(sequelize, DataTypes) {
  const PartsmartOrderEnquiry = sequelize.define(
    'partsmart_order_enquiries',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      enquiryNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      workshopId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      customerCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      referenceNo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(50),
        defaultValue: 'dearo',
      },
      channel: {
        type: DataTypes.STRING(50),
        defaultValue: 'B2B-API',
      },
      vehicleNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      parts: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'PROCESSING',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      orderNos: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createResponse: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return PartsmartOrderEnquiry;
}

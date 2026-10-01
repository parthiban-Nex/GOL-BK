export default function stocktransferoracledata(sequelize, DataTypes) {
   const StockTransferOracle = sequelize.define('stock_transfer_oracles', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dmsStnNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'DMS Stock Transfer Note Request number',
    },
    stnOrderRefNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Order Reference Number for STN No',
    },
    stnOrderRefNumber1: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Additional Order Reference Number for DMS STN No',
    },
    toCreationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Transfer Order (TO) Creation Date in Oracle',
    },
    toCreatedBy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Transfer Order (TO) Created by Oracle user name',
    },
    oracleTONo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Transfer Order (TO) number created in Oracle for STN number',
    },
    fromKiWarehouse: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Ki Warehouse to dispatch the stock to DMS Outlet',
    },
    DMSWarehouse: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'DMS State wise logical (virtual) Inventory org maintaied in the Oracle',
    },
    DMSOutlet: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'DMS Outlet name maintained as subinventory in Oracle',
    },
    toShippedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'TO Shipped Date from Oracle to DMS',
    },
    shipmentNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Shipment (Delivery) Number in Oracle. Single TO may have multiple deliveries',
    },
    shipmentStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Shipment Status in Oracle',
    },
   
    inward_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '1-open, 2-completed',
    },
    grn_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'stock_transfer_oracles',
    timestamps: true,
    underscored: false,
  });

  return StockTransferOracle;
  }
  
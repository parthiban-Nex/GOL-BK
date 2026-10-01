export default function inventoryPhotoCategoryDatas(sequelize, DataTypes) {
  const InventoryPhotoCategory = sequelize.define(
    'vrm_master_inventory_photo_category',
    {
      CATEGORY_ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      VEHICLE_TYPE: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CATEGORY_NAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ICON_LINK: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      IS_MANDATORY: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      MIN_COUNT: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      MAX_COUNT: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      SORT_ORDER: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ACTIVE: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      CREATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      CREATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'CREATED_DATE',
      },
      UPDATED_BY: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      UPDATED_DATE: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'UPDATED_DATE',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'CREATED_DATE',
      updatedAt: 'UPDATED_DATE',
    }
  );

  return InventoryPhotoCategory;
}

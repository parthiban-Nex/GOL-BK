export default function imageCount(sequelize, DataTypes) {
  const imageCount = sequelize.define(
    'vrm_trans_customer_visit_info',
    {
      VISIT_ID: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true
      },
      INVENTORY_PHOTO_COUNT: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
      INSPECTION_PHOTO_COUNT: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
      SIGNATURE_PHOTO_COUNT: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      }
    },

  );

  return imageCount;
}
export default function mobileImages(sequelize, DataTypes) {
  const MobileImages = sequelize.define(
    'vrm_trans_images',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      visit_id: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      link: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      active: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'createdAt',
      },
      updated_by: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'updatedAt',
      },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return MobileImages;
}

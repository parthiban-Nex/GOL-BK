export const SERVICES = {
  PERIODIC_MAINTENANCE: 'Periodic Maintenance',
  EXPRESS_CAR_SERVICE: 'Express Car Service',
  AC_CAR_SERVICE: 'AC Car Service',
  CAR_WASH: 'Car Wash',
};

export default function campaignMessageDatas(sequelize, DataTypes) {
  const CampaignMessage = sequelize.define(
    'campaign_message',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      mobile_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'templates',
          key: 'id',
        },
      },
      service_type: {
        type: DataTypes.ENUM(...Object.keys(SERVICES)),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
    },
    {
      tableName: 'campaign_messages',
      timestamps: true,
      indexes: [{name: 'idx_cm_customer_id',fields: ['customer_id'], },
                {name: 'idx_cm_template_id',fields: ['template_id'], },
                {name: 'idx_cm_service_type',fields: ['service_type'],},
        {
          name: 'idx_cm_createdAt',
          fields: ['createdAt'],
        },
      ],
    }
  );

  return CampaignMessage;
}

export default function templateDatas(sequelize, DataTypes) {
  const Template = sequelize.define(
    'template',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'title is required',
          },
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'content is required',
          },
        },
      },
      footer: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
    },
    {
      tableName: 'templates',
      paranoid: true,
      timestamps: true,
      indexes: [
        {
          name: 'idx_templates_createdAt',
          fields: ['createdAt'],
        },
      ],
    }
  );

  return Template;
}

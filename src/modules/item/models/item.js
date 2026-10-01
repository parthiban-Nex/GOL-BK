export default function itemdatas(sequelize, DataTypes) {
  const Item = sequelize.define(
    'item',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      itemCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          arg: true,
          msg: 'Item Code Unique',
        },
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'ItemCode is required',
          },
          notEmpty: {
            msg: 'ItemCode is not empty',
          },
        },
      },
      itemName: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'ItemName is required',
          },
          notEmpty: {
            msg: 'ItemName is not empty',
          },
        },
      },
      itemDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'ItemDescription is required',
          },
          notEmpty: {
            msg: 'ItemCode is not empty',
          },
        },
      },
      itemgroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'itemgroups',
        //   key: 'id',
        // },
      },
      uomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      itemcategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'itemcategories',
        //   key: 'id',
        // },
      },
      hsnId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'hsns',
          key: 'id',
        },
      },
      hsnCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'hsnCode is required',
          },
          notEmpty: {
            msg: 'hsnCode is not empty',
          },
        },
      },
      makeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'makes',
        //   key: 'id',
        // },
      },
      modelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'models',
        //   key: 'id',
        // },
      },
      aggregateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'aggregates',
        //   key: 'id',
        // },
      },
      subaggregateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'subaggregates',
        //   key: 'id',
        // },
      },
      list: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      mrp: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      cost: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      taxPercentage: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      vehicletypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // references: {
        //   model: 'vehicletypes',
        //   key: 'id',
        // },
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        allowNull: false,
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
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );

  return Item;
}

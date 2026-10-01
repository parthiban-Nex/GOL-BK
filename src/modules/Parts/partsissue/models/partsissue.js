export default function partsIssuedatas(sequelize, DataTypes) {
  const PartsIssue = sequelize.define(
    'parts_issue',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'OutletId is required',
          },
        },
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      indent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      item_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      item_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      rate: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Rate is required',
          },
        },
      },
      cost: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'Cost is required',
          },
        },
      },
      mrp: {
        type: DataTypes.DOUBLE,
        allowNull: false, // Mandatory
        validate: {
          notNull: {
            msg: 'MRP is required',
          },
        },
      },
      total: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      discount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      sgst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      cgst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      igst: {
        type: DataTypes.DOUBLE(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      repair_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'createdBy is required',
          },
        },
      },
    },
    {
      timestamps: true,
    }
  );

  return PartsIssue;
}

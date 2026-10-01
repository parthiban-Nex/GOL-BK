export default function laborScheduledatas(sequelize, DataTypes) {
  const LaborSchedule = sequelize.define(
    'laborschedule',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      laborCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'LaborCode is required',
          },
          notEmpty: {
            msg: 'LaborCode is not Empty',
          },
        },
      },
      laborDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'labor description is required',
          },
          notEmpty: {
            msg: 'labor description is not empty',
          },
        },
      },
      sacCode: {
        type: DataTypes.STRING(25),
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'SacCode is required',
          },
          notEmpty: {
            msg: 'SacCode is not empty',
          },
        },
      },
      taxPercentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'TaxPercentage is required',
          },
          notEmpty: {
            msg: 'TaxPercentage is not Empty',
          },
        },
      },
      aa: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      ab: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      ac: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      ad: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      ae: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },

      ba: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      bb: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      bc: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      bd: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      be: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },

      ca: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      cb: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      cc: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      cd: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      ce: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },

      da: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      db: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      dc: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      dd: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      de: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: null },
      
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      parts_mapping: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      standard_man_hrs: {
        type: DataTypes.STRING(25),
        allowNull: true,
        defaultValue: null,
      },
      osl: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'Osl is required',
          },
          notEmpty: {
            msg: 'Osl is not Empty',
          },
        },
      },
      stdhrsA: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'stdhrsA is required',
          },
          notEmpty: {
            msg: 'stdhrsA is not Empty',
          },
        },
      },
      stdhrsB: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'stdhrsB is required',
          },
          notEmpty: {
            msg: 'stdhrsB is not Empty',
          },
        },
      },
      stdhrsC: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'stdhrsC is required',
          },
          notEmpty: {
            msg: 'stdhrsC is not Empty',
          },
        },
      },
      stdhrsD: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'stdhrsD is required',
          },
          notEmpty: {
            msg: 'stdhrsD is not Empty',
          },
        },
      },
      stdhrsE: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'stdhrsE is required',
          },
          notEmpty: {
            msg: 'stdhrsE is not Empty',
          },
        },
      },
      citySegmentA: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'citySegmentA is required',
          },
          notEmpty: {
            msg: 'citySegmentA is not Empty',
          },
        },
      },
      citySegmentB: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'citySegmentB is required',
          },
          notEmpty: {
            msg: 'citySegmentB is not Empty',
          },
        },
      },
      citySegmentC: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'citySegmentC is required',
          },
          notEmpty: {
            msg: 'citySegmentC is not Empty',
          },
        },
      },
      citySegmentD: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        notEmpty: false,
        validate: {
          notNull: {
            msg: 'citySegmentD is required',
          },
          notEmpty: {
            msg: 'citySegmentD is not Empty',
          },
        },
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

  return LaborSchedule;
}

export default function LeadsDatas(sequelize, DataTypes) {
  const Lead = sequelize.define(
    'leads',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      leadNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        notEmpty: true,
        unique: true,
      },
      regNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        notEmpty: true,
        unique: true,
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      customerName: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      pincode: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      transportName: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      properitor: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: false,
        isEmail: true,
        validate: {
          isEmail: {
            msg: 'Invalid email',
          },
        },
      },
      managerName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      mobileNo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: false,
        validate: {
          notNull: {
            msg: 'mobileNo is required',
          },
          len: {
            args: [10, 10],
            msg: 'Min length of the Mobile Number is 10',
          },
        },
      },
      customerAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      aadhaarNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      panNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gstNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      makeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'makes',
          key: 'id',
        },
      },
      modelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'models',
          key: 'id',
        },
      },
      mfgYear: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      application: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      stageNorm: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      insurance: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      insuranceExpDate: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      insuranceFcDate: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      engineNo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      hp: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      avgKmpm: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      avgHourspm: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      outletId: {
        type: DataTypes.INTEGER,
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
  )

  return Lead;
}
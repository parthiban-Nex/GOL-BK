export default function varientdatas(sequelize, DataTypes) {
  const Varient = sequelize.define(
    'varients',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      varientName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'Varient  Name is required',
          },
          notEmpty: {
            msg: 'Varient Name is not Empty',
          },
        },
      },
      varientDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        notEmpty: true,
        validate: {
          notNull: {
            msg: 'varientDescription is required',
          },
          notEmpty: {
            msg: 'varientDescription is not Empty',
          },
        },
      },
      // fuelType: {
      //   type: DataTypes.STRING(20),
      //   allowNull: false,
      //   notEmpty: true,
      //   validate: {
      //     notNull: {
      //       msg: 'Varient  Name is required',
      //     },
      //     notEmpty: {
      //       msg: 'Varient Name is not Empty',
      //     },
      //   },
      // },
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

  return Varient;
}


export default function OutletSequenceNumData(sequelize, DataTypes) {
  const Billings = sequelize.define(
    'outlet_sequence_num_old_dms',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      outlet_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      outlet_code: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      last_ajc_bill_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ajc_update_flag:{
        type:DataTypes.INTEGER,
        defaultValue: 0
      },
      last_rjc_bill_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
        rjc_update_flag:{
        type:DataTypes.INTEGER,
        defaultValue: 0
      },
     
      // created_date: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      //   defaultValue: DataTypes.NOW,
      //   field: 'created_date',
      // },
      // updated_Date: {
      //   type: DataTypes.DATE,
      //   allowNull: true,
      //   field: 'updated_Date',
      // },
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );
  return Billings;
}

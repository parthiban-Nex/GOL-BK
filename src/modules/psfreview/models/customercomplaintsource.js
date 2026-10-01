export default function customercomplaintsourcedatas(sequelize, DataTypes) {
    const customercomplaintsource = sequelize.define(
      'customer_complaint_sources',
      {
        id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
},
        
      
      {
        timestamps: true,
        createdAt: true,
        updatedAt: true,
      }
    );
  
    return customercomplaintsource;
  }
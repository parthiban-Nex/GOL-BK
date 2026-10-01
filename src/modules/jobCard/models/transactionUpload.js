export default function TransUploadDetailsDatas(sequelize, DataTypes) {
  const TransUploadDetails = sequelize.define(
    "trans_upload_details",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      basic_vehicle_photo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      basic_vehicle_photo_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      insurance_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      insurance_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      rc_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      rc_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      licence_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      licence_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      filled_claim_form: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      filled_claim_form_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      permit_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      permit_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      fitness_certificate_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fitness_certificate_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      gd_fir_entry: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      gd_fir_entry_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      pan_card_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pan_card_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      customer_photo_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      customer_photo_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      aadhar_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      aadhar_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      kyc_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      kyc_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      estimate_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      estimate_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      satisfaction_voucher: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      satisfaction_voucher_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      damage_photos: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      damage_photos_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      reinspection_photos: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reinspection_photos_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      payment_receipt_copy: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      payment_receipt_copy_signed_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
  
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true, 
    }
  );

  return TransUploadDetails;
};

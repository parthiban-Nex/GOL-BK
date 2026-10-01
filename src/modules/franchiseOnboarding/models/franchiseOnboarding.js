import { INTEGER } from "sequelize";

export default function franchiseonboardingdatas(sequelize, DataTypes) {
    const FranchiseOnboarding = sequelize.define(
        'franchise_onboardings',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            outlet_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            franchise_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            nmsa_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            franchise_name: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            vehicle_type: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            address_line_1: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            address_line_2: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            landmark: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            franchise_pincode: {
                type: DataTypes.INTEGER,
                allowNull: false,
                notEmpty: false,

                validate: {
                    notNull: {
                        msg: 'Please enter pincode',
                    },
                    len: {
                        args: [6, 6],
                        msg: 'Min length of the pincode is 6',
                    },
                    notEmpty: {
                        msg: 'pincode cannot be Empty',
                    },
                },
            },
            franchise_state: {
                type: DataTypes.STRING(25),
                allowNull: false,
                notEmpty: false,
                validate: {
                    notNull: {
                        msg: 'state is required',
                    },
                    notEmpty: {
                        msg: 'state cannot be Empty',
                    },
                },
            },

            franchise_city: {
                type: DataTypes.STRING(25),
                allowNull: false,
                notEmpty: false,
                validate: {
                    notNull: {
                        msg: 'city is required',
                    },
                    notEmpty: {
                        msg: 'city cannot be Empty',
                    },
                },
            },
            franchise_region: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            franchise_email: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            alternate_franchise_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            franchise_contact_no: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: true,
                notEmpty: false,
                validate: {
                    notNull: {
                        msg: 'Please enter a valid number',
                    },
                    len: {
                        args: [10, 10],
                        msg: 'Min length of the phone number is 10',
                    },
                    notEmpty: {
                        msg: 'phoneNumber is not Empty',
                    },
                },
            },
            alternate_franchise_contact_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            landline_number: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            whatsapp_number: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            start_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            end_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            area_size: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            location_type: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            rental_start_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            rental_end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            lease_start_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            lease_end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            franchise_latitude: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            franchise_longitude: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            level1_user: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level1_user_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level1_user_mobile: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            level1_user_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level2_user: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level2_user_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level2_user_mobile: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            level2_user_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level3_user: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level3_user_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            level3_user_mobile: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            level3_user_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            ownership_type: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            owner_saluation: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            owner_first_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            owner_last_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            franchise_owner_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            franchise_owner_contact_no: {
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            owner_aadhar_number: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            aadhar_card: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            aadhar_card_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            owner_pan: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            franchise_gst_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            franchise_pan_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            franchise_gst_reg_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            gst_doc: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            gst_doc_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            franchise_tin: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            franchise_tan: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            factory_license: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            factory_license_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            pcb_license: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            pcb_license_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            fire_license: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            fire_license_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            property_license: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            property_license_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            bank_acc_no: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            bank_acc_type: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            bank_ifsc: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            bank_micr: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            bank_branch: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            bank_pincode: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            bank_state: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },

            bank_city: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },
            bank_address_1: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            bank_address_2: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            cancel_cheque: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            cancel_cheque_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            bay_capacity: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_lifts: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_flatbed_vehicles: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_recovery_crane: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_zero_degree_flatbed: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            towing: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            no_of_tow_vehicles: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            wheel_balancer_machine: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            wheel_alignment_machine: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            car_scanner: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            car_scanner_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            dent_puller: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            spot_welder: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            mig_welder: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            paint_booth: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            pick_drop: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            manager_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            manager_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            manager_contact_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            no_of_vehicles: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_employees: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_trained_mechanics: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_service_advisors: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_electricians: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_tinker: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            frontoffice_count: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            technician_count: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            denter_count: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            painter_count: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_parts_executives: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_helpers: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_driver: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_ac_mechanic: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_service_manager: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            no_of_supervisor: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            weekly_off: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            uniform: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            stationary: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            spoc1_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            spoc1_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            spoc1_contact_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            spoc2_name: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            spoc2_mail: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            spoc2_contact_no: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            pickup_radius: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            brand: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            service_pincode: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            weekly_leads: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            weekly_counter: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            remark_1: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            remark_2: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING(20),
                allowNull: true,
                default:0
            },
            statusText: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },
            handingover_status: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            contract_terms: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            workshop_category: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            business_category: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            min_sqft: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            compressor: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                default: 1
            },
            paint_mixing: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                default: 1
            },
            customer_lounge: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                default: 1
            },
            front_office: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                default: 1
            },
            spare_parts_area: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                default: 1
            },
            washing_area: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                default: 1
            },
            tasl_bank_acc_no: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            tasl_bank_acc_type: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            tasl_bank_ifsc: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            tasl_bank_micr: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            tasl_bank_branch: {
                type: DataTypes.STRING(200),
                allowNull: true,
            },
            tasl_bank_pincode: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            tasl_bank_state: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },

            tasl_bank_city: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },
            tasl_bank_address_1: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            tasl_bank_address_2: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            rejection_remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            signup_fee_total_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            signup_fee_paid_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            signup_fee_payment_mode: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            signup_fee_reference_number: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },
            signup_fee_payment_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            signup_fee_doc: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            signup_fee_doc_signed_url: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            nm_approval: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            zm_approval: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            nm_rejection_remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            zm_rejection_remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            handover_reject_remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
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
            createdAt: 'created',
            updatedAt: false,
        }
    );

    return FranchiseOnboarding;
}
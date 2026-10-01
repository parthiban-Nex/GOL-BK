import db from '../index.js';
import utils from '../Utils/Utils.js';
import encryptConfig from '../../config/encrypt.js';

const vehicle = db.vehicles;
const users = db.users;
const jobCard = db.jobCard;
const employee = db.employees;
const vehicleModel = db.models;
const customer = db.customers

async function sendWhatsAppMessage(inspectionMessage, visitId) {
    let apiMessage = inspectionMessage

    // 🔹 Cleanup (same as PHP)
    apiMessage = apiMessage
        .replace(/^[ \t]*[\r\n]+/gm, '')
        .replace(/\n/g, '-')
        .replace(/\r\n|\r/g, '\n');

    // ----------------------------
    // Extract sections
    // ----------------------------
    let inspectionFindings = '';
    let exteriorDamage = '';
    let inventoryStatus = '';

    // Inspection Findings
    const inspectionMatch = apiMessage.match(
        /Inspection Findings:(.*?)(Inventory Status:|Exterior Damage:|$)/is
    );
    if (inspectionMatch) {
        inspectionFindings = `Inspection Findings: ${inspectionMatch[1].trim()}`;
    }

    // Exterior Damage
    const exteriorMatch = apiMessage.match(
        /Exterior Damage\s*:\s*(.*?)(Inventory Status:|$)/is
    );
    exteriorDamage = exteriorMatch
        ? `Exterior Damage: ${exteriorMatch[1].trim()}`
        : 'Exterior Damage: No Damage Found';

    // Inventory Status
    const inventoryMatch = apiMessage.match(
        /Inventory Status:\s*(.*)/is
    );
    inventoryStatus = inventoryMatch
        ? `Inventory Status: ${inventoryMatch[1].trim()}`
        : 'Inventory Status: All are Good';

    // ----------------------------
    // DB Queries
    // ----------------------------
    const vehicleData = await jobCard.findOne({
        where: {
            id: visitId
        },
        include: [
            {
                model: vehicle,
                as: "vehicleDetails",
                include: [
                    {
                        model: vehicleModel,
                        as: 'model'
                    }
                ]
            },
            {
                model: users,
                as: 'user_sa',
                include: [
                    {
                        model: employee,
                        as: 'employee'
                    }
                ]
            },
            {
                model: customer,
                as: 'jobcardcustomer',
                attributes: [
                    'id',
                        [
                            db.Sequelize.literal(
                                `CAST(AES_DECRYPT(UNHEX(jobcardcustomer.mobileNumber), '${encryptConfig.code}') AS CHAR)`
                            ),
                            'mobileNumber'
                        ],
                ]
            }
        ],
        raw : true,
        nest: true 
    })


    const linkMessage = `https://tvsfit.mytvs.in/reporting/vrm/landingpages/estimates/test/#!/main/${visitId}`;

    // ----------------------------
    // WhatsApp template parameters
    // ----------------------------
    let fuelLevel = "";

    if (vehicleData.fuel_level == null || vehicleData.fuel_level == 0) {
        fuelLevel = "having No Fuel";
    } else {
        fuelLevel = `having ${vehicleData.fuel_level}% Fuel`
    }

    let customer_mobileNumber = vehicleData.jobcardcustomer.mobileNumber;


    let vehicleDataFuelMessage = `${vehicleData.vehicleDetails.model.modelName} - which has driven ${fuelLevel}`;
    const parameters = [
        vehicleData.reg_no,
        vehicleDataFuelMessage,
        inspectionFindings,
        exteriorDamage,
        inventoryStatus,
        linkMessage,
        vehicleData.user_sa.employee.employeeName,
        vehicleData.user_sa.employee.mobileNumber
    ];


    const template = {
        templateId: 'harman_utility_message',
        parameterValues: parameters
    };

    utils.sendWhatsAppMessage(customer_mobileNumber, "This is a test message", template);

}


const InspectionWhatsApp = {
    sendWhatsAppMessage
}

export default InspectionWhatsApp;
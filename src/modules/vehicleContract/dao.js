import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, fn, col } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';

const Vehicle = db.vehicles;
const Customer = db.customers;
const Make = db.makes;
const Model = db.models;
const Scheme = db.scheme;
const VehicleContract = db.vehicleContract;
const VehicleContractScheme = db.vehicleContractScheme;
const SchemeLabors = db.schemeLabor;
const SchemeParts = db.schemePart;
const Outlet = db.outlets;

const getVehicleForScheme = async (reqData, user) => {
    try {
        const searchCondition = { customerId: reqData.customerId };
        let data = await Vehicle.findAll({
            where: { ...searchCondition },
            include: [
                { model: Make, as: 'make', attributes: ['makeName'] },
                { model: Model, as: 'model', attributes: ['modelName'] },
            ],
            attributes: [
                'id', 'registrationNumber', 'makeId', 'modelId'
            ]
        });

        return data;
    } catch (err) {
        logger.error('VehicleContract dao getVehicleForScheme', err);
    }
}

const getSchemeDetails = async (reqData, user) => {
    try {
        const searchCondition = { makeId: reqData.makeId, modelId: reqData.modelId };
        let data = await Scheme.findAll({
            where: { ...searchCondition }
        })

        return data;
    } catch (err) {
        logger.error('VehicleContract dao getSchemeDetails', err);
    }
}

const listVehicleContract = async (reqData, user) => {
    let rows = {};
    let count = 0;
    try {
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey
            ? {
                [Op.or]: [
                    { vehicle_number: { [Op.like]: `%${searchKey}%` } },
                    { customer_code: { [Op.like]: `%${searchKey}%` } },
                ],
            }
            : {};
        count = await VehicleContract.count({
            where: { ...searchCondition }
        });
        rows = await VehicleContract.findAll({
            where: { ...searchCondition },
            limit,
            offset,
            order: [['id', 'DESC']],
        })
        return {
            totalItems: count,
            data: rows,
        };
    } catch (err) {
        logger.error('VehicleContract dao listVehicleContract', err);
    }
}

const createVehicleContract = async (reqData, user) => {
    let data = {};
    try {
        data = await VehicleContract.create({
            doc_no: reqData.docNo,
            customer_id: reqData.customerId,
            customer_code: reqData.customerName,
            vehicle_id: reqData.vehicleId,
            vehicle_number: reqData.registrationNumber,
            scheme_id: reqData.schemeId,
            start_date: reqData.startDate,
            end_date: reqData.endDate,
            amount: reqData.amount,
            cgst: reqData.cgst,
            sgst: reqData.sgst,
            igst: reqData.igst,
            total_amount: reqData.totalInvoice,
            outlet_id: user.outlet.id,
            created_by: user.id
        })
    } catch (err) {
        logger.error('VehicleContract dao createVehicleContract', err);
    }
    return data;
}

const createVehicleContractScheme = async (contractData, laborPartData) => {
    let data = {};
    try {
        data = await VehicleContractScheme.create({
            vehicle_contract_id: contractData.id,
            scheme_id: contractData.scheme_id,
            item_type: laborPartData.itemType,
            scheme_labor_parts_id: laborPartData.id,
            labor_parts_id: laborPartData.itemType === 1 ? laborPartData.labor_id : laborPartData.part_id,
            scheme_labor_parts_code: laborPartData.itemType === 1 ? laborPartData.labor_code : laborPartData.part_code,
            count: laborPartData.count,
            balance_count: laborPartData.count,
            start_date: contractData.start_date,
            end_date: contractData.end_date
        })
    } catch (err) {
        logger.error('VehicleContract dao createVehicleContract', err);
    }
}

const editVehicleContract = async (reqData, user) => {
    let data = {};
    try {
        data = await VehicleContract.update({
            schemeId: reqData.schemeId,
            startDate: reqData.startDate,
            endDate: reqData.endDate,
            amount: reqData.amount,
            cgst: reqData.cgst,
            sgst: reqData.sgst,
            igst: reqData.igst,
            discount: reqData.discount ? reqData.discount : 0,
            totalInvoice: reqData.totalInvoice,
            updatedBy: user.id
        }, { where: { id: reqData.id } })
        return data;
    } catch (err) {
        logger.error('VehicleContract dao editVehicleContract', err);
    }
}

const getSchemeLabourParts = async (schemeId) => {
    try {
        const searchCondition = { id: schemeId };
        let data = await Scheme.findOne({
            where: { ...searchCondition },
            include: [
                { model: SchemeLabors, as: 'labours' },
                { model: SchemeParts, as: 'parts' }
            ],
            attributes: [
                'id', 'scheme_name'
            ]
        })

        return data;
    } catch (err) {
        logger.error('VehicleContract dao getSchemeLabourParts', err);
    }
}

const getRecentVehicleContract = async (outletCode, year) => {
    const recentVehicleContract = VehicleContract.findOne({
        where: {
            doc_no: {
              [Op.like]: `CSD-${outletCode}${year}%`,
            },
          },
        order: [["id", "DESC"]]
    });

    return recentVehicleContract;
}

const getVehicleContract = async (id) => {
    
    try {
        const fieldsToDecrypt = [
            { field: 'firstName', alias: 'decryptedFirstName' },
            { field: 'lastName', alias: 'decryptedLastName' },
        ];
        const decryptedAttributes = fieldsToDecrypt.map(item => [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
            item.alias
        ]);
        const data = await VehicleContract.findOne({
            where: { id: id },
            include: [
                { model: Scheme, as: 'scheme'},
                { model: VehicleContractScheme, as: 'vehicleContractSchemes' },
                {   
                    model: Customer,
                    as: 'customer',
                    attributes: {
                        include: decryptedAttributes
                    }  
                },
                {
                    model: Vehicle, as: 'vehicle',
                    include: [
                        { model: Model, as: 'model' },
                        { model: Make, as: 'make' },
                    ],
                },
                {
                    model: Outlet, as: 'outlet'
                }
            ],
        })
        return data;
    } catch (err) {
        logger.error('VehicleContract dao getVehicleContract', err);
    }
}

const getVehicleContractData = async (reqData, user) => {
    try {
        const { searchKey } = reqData;
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        const userCondition = {
            createdAt: {
                [Op.between]: [startDate, endDate]
            },
            vehicle_number: {[Op.like]: reqData.vehicleNumber ? `%${reqData.vehicleNumber}%` : `%${""}%`}
        };

        const searchCondition = searchKey ? {
            [Op.or]: [
                { doc_no: { [Op.like]: `%${searchKey}%`} },
                { vehicleNumber: { [Op.like]: `%${searchKey}%`}}
            ]
        } : {};

        let queryOptions = {};

        const fieldsToDecrypt = [
            { field: 'firstName', alias: 'decryptedFirstName' },
            { field: 'lastName', alias: 'decryptedLastName' },
            { field: 'mobileNumber', alias: 'decryptedMobileNumber' },
        ];
        const decryptedAttributes = fieldsToDecrypt.map(item => [
            db.sequelize.literal(`CAST(AES_DECRYPT(UNHEX(${item.field}), '${encryptConfig.code}') AS CHAR)`),
            item.alias
        ]);

        if(user.reportAccess === 1) {
            queryOptions = {
                where: {
                    outlet_id: {
                        [Op.in]: literal(
                            `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                        )
                    },
                    created_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: {
                            include: decryptedAttributes
                        }
                    },
                    { model: Scheme, as: 'scheme'},
                    { model: VehicleContractScheme, as: 'vehicleContractSchemes' },
                    { model: Outlet, as: 'outlet' },
                    {
                    model: Vehicle, as: 'vehicle',
                    include: [
                        { model: Model, as: 'model' },
                        { model: Make, as: 'make' },
                    ],
                },
                ]
            };
        } else {
            queryOptions = {
                where: {
                    created_by: user.id,
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [["id", "DESC"]],
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: {
                            include: decryptedAttributes
                        }
                    },
                    { model: Scheme, as: 'scheme'},
                    { model: VehicleContractScheme, as: 'vehicleContractSchemes' },
                    { model: Outlet, as: 'outlet' },
                    {
                    model: Vehicle, as: 'vehicle',
                    include: [
                        { model: Model, as: 'model' },
                        { model: Make, as: 'make' },
                    ],
                },
                ]
            };
        }

        if(reqData.limit && reqData.offset !== undefined) {
            // queryOptions.limit = reqData.limit;
            // queryOptions.offset = reqData.offset;

            if(reqData.searchKey) {
                const searchKey = reqData.searchKey.trim();
                queryOptions.where[Op.or] = [
                    { '$doc_no$': { [Op.like]: `%${searchKey}%`}},
                    { '$vehicle_number$': { [Op.like]: `%${searchKey}%`}},
                    { '$customer_code$': { [Op.like]: `%${searchKey}%`}},
                ];
            }
        };

        const rows = await VehicleContract.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error("Vehicle Contract dao getVehicleContractData", err);
    };
};

const checkVehicleContract = async (vehicleId, schemeId) => {
    try {
        return await VehicleContract.findOne({
            where: {
                vehicle_id : vehicleId,
                scheme_id : schemeId
            }
        })
    } catch (err) {
        logger.error("Vehicle Contract dao checkVehicleContract", err);
    }
}

const dao = {
    getVehicleForScheme,
    getSchemeDetails,
    listVehicleContract,
    createVehicleContract,
    editVehicleContract,
    createVehicleContractScheme,
    getSchemeLabourParts,
    getRecentVehicleContract,
    getVehicleContract,
    getVehicleContractData,
    checkVehicleContract
};

export default dao;
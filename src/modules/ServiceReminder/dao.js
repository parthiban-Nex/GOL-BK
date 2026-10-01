import db from '../index.js';
import logger from '../../config/logger.js';
import moment from 'moment-timezone';
import { Op, Sequelize, literal } from 'sequelize';
import { makeRules } from '../make/rules/rule.js';

const ServiceReminder = db.serviceReminder;
const ServiceReminderAlert = db.serviceReminderAlert;
const Vehicle = db.vehicles;
const Make = db.makes;
const Model = db.models;
const JobCard = db.jobCard;
const Outlet = db.outlets;
const Leads = db.leads;

const createServiceReminder = async (serviceReminder, user) => {
    let data = {};
    let lastServiceDate;
    let nextServiceDate;
    let tvsNextServiceDate;
    let date = new Date();
    let isJcId = []
    try {
        for (const insertReminderAlert of serviceReminder.records) {
            isJcId = await ServiceReminderAlert.findAll({
                where: {
                    jc_id: serviceReminder.job_card_id,
                    schedule_code: insertReminderAlert.scheduleCode
                }
            });

            if(isJcId.length === 0) {
                isJcId = await ServiceReminderAlert.findAll({
                    where: {
                        jc_id: serviceReminder.job_card_id,
                        schedule_code: {[Op.or]: ['WH 103', 'WH 104', 'WH 105', 'WH 106']}
                    }
                });
            }

            if (insertReminderAlert.last_service_km !== "" || insertReminderAlert.last_service_date !== "" || insertReminderAlert.next_service_date !== "") {
                lastServiceDate = insertReminderAlert.last_service_date
                    ? moment(insertReminderAlert.last_service_date) : moment();
                let tvsNextServiceDateIs = (insertReminderAlert.avg_km_btw_service / serviceReminder.PerDayKm);
                tvsNextServiceDate = lastServiceDate.add(tvsNextServiceDateIs, 'days');

                if(isJcId.length > 0){
                    data = await ServiceReminderAlert.update({
                        outlet_id: serviceReminder.outlet_id,
                        jc_id: serviceReminder.job_card_id !== "" ? serviceReminder.job_card_id : null,
                        lead_id: serviceReminder.lead_id !== "" ? serviceReminder.lead_id : null,
                        jc_number: serviceReminder.job_card_number,
                        schedule_id: insertReminderAlert.scheduleId,
                        schedule_code: insertReminderAlert.scheduleCode,
                        schedule_description: insertReminderAlert.scheduleDescription,
                        customer_id: serviceReminder.customer_id ?? null,
                        customer_code: serviceReminder.customer_code ?? null,
                        vehicle_id: serviceReminder.vehicle_id !== "" ? serviceReminder.vehicle_id : null,
                        vehicle_reg_no: serviceReminder.vehicle_reg_no,
                        avg_km_per_day: serviceReminder.PerDayKm ? serviceReminder.PerDayKm : null,
                        avg_km_btw_service: insertReminderAlert.avg_km_btw_service ? insertReminderAlert.avg_km_btw_service : null,
                        last_service_km: insertReminderAlert.last_service_km !== "" ? insertReminderAlert.last_service_km : null,
                        last_service_date: insertReminderAlert.last_service_date !== "" ? insertReminderAlert.last_service_date : null,
                        next_service_date: insertReminderAlert.next_service_date !== ""
                            ? insertReminderAlert.next_service_date : null,
                        tvs_next_service_date: tvsNextServiceDate ? tvsNextServiceDate : null,
                        created_by: insertReminderAlert.created_by ? "" : user
                    }, 
                    {where: { id: isJcId[0].id }});
                } else {
                    data = await ServiceReminderAlert.create({
                        outlet_id: serviceReminder.outlet_id,
                        jc_id: serviceReminder.job_card_id !== "" ? serviceReminder.job_card_id : null,
                        lead_id: serviceReminder.lead_id !== "" ? serviceReminder.lead_id : null,
                        jc_number: serviceReminder.job_card_number,
                        schedule_id: insertReminderAlert.scheduleId,
                        schedule_code: insertReminderAlert.scheduleCode,
                        schedule_description: insertReminderAlert.scheduleDescription,
                        customer_id: serviceReminder.customer_id ?? null,
                        customer_code: serviceReminder.customer_code ?? null,
                        vehicle_id: serviceReminder.vehicle_id !== "" ? serviceReminder.vehicle_id : null,
                        vehicle_reg_no: serviceReminder.vehicle_reg_no,
                        avg_km_per_day: serviceReminder.PerDayKm ? serviceReminder.PerDayKm : null,
                        avg_km_btw_service: insertReminderAlert.avg_km_btw_service ? insertReminderAlert.avg_km_btw_service : null,
                        last_service_km: insertReminderAlert.last_service_km !== "" ? insertReminderAlert.last_service_km : null,
                        last_service_date: insertReminderAlert.last_service_date !== "" ? insertReminderAlert.last_service_date : null,
                        next_service_date: insertReminderAlert.next_service_date !== ""
                            ? insertReminderAlert.next_service_date : null,
                        tvs_next_service_date: tvsNextServiceDate ? tvsNextServiceDate : null,
                        created_by: insertReminderAlert.created_by ? "" : user
                    });
                };
            };
        };
    } catch (err) {
        logger.error('Service Reminder Alert dao createServiceReminder', err);
    };

    return data;
};

const listServiceReminderAlert = async () => {
    try {
        const rows = await ServiceReminder.findAll({});

        return rows;
    } catch (err) {
        logger.error('Service Reminder Alert dao listServiceReminderAlert', err);
        console.log(err);
    };
};

const getServiceReminderAlert = (jcId, leadId) => {
    try {
        const data = ServiceReminderAlert.findAll({
            where: {
                [Op.or]: {
                    jc_id: jcId, lead_id: leadId
                }
            },
            order: [["id", "DESC"]]
        });

        return data;
    } catch (err) {
        logger.error('Service reminder alert dao getServiceReminderAlert', err);
        console.log(err);
    };
};


const getServiceReminderData = async (reqData, user) => {
    try {
        const { searchKey, offset, limit } = reqData;
        const startDate = reqData.startDate + ' 00:00:00';
        const endDate = reqData.endDate + ' 23:59:59';

        const userCondition = {
            createdAt: {
                [Op.between]: [startDate, endDate]
            },
            vehicle_reg_no: { [Op.like]: reqData.vehicleNumber ? `%${reqData.vehicleNumber}%` : `%${""}%` },
        };

        const searchCondition = searchKey ? {
            [Op.or]: [
                { jc_number: { [Op.like]: `%${searchKey}%` } },
                { vehicle_reg_no: { [Op.like]: `%${searchKey}%` } },
            ]
        } : {};

        let queryOptions = {};

        // if (user.roleid == 5) {
        if (user.reportAccess === 1) {
            if (reqData.alertType === "JC") {
                queryOptions = {
                    where: {
                        outlet_id: {
                            [Op.in]: literal(
                                `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                            )
                        },
                        jc_id: { [Op.ne]: null },
                        ...userCondition, ...searchCondition
                    },
                    // limit,
                    //     offset,
                    order: [["id", "DESC"]],
                    include: [
                        {
                            model: JobCard,
                            as: "jobcard",
                            include: [
                                {
                                    model: Vehicle,
                                    as: "vehicle",
                                    include: [
                                        { model: Model, as: 'model', attributes: ['modelName'] },
                                        { model: Make, as: 'make', attributes: ['makeName'] }
                                    ],
                                    attributes: ['engineNumber', 'chassisNumber', 'registrationNumber']
                                },
                            ],
                        },
                        { model: Outlet, as: 'outlet', attributes: ['outletCode'] }
                    ]
                };
            } else {
                queryOptions = {
                    where: {
                        outlet_id: {
                            [Op.in]: literal(
                                `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                            )
                        },
                        lead_id: { [Op.ne]: null },
                        ...userCondition, ...searchCondition
                    },
                    // limit,
                    //     offset,
                    order: [["id", "DESC"]],
                    include: [
                        {
                            model: Leads,
                            as: "lead",
                            include: [
                                {
                                    model: Vehicle,
                                    as: "vehicle",
                                    include: [
                                        { model: Model, as: 'model', attributes: ['modelName'] },
                                        { model: Make, as: 'make', attributes: ['makeName'] }
                                    ],
                                    attributes: ['engineNumber', 'chassisNumber', 'registrationNumber']
                                },
                            ],
                        },
                        { model: Outlet, as: 'outlet', attributes: ['outletCode'] }
                    ]
                };
            }

        } else {
            if (reqData.alertType === "JC") {
                queryOptions = {
                    where: {
                        ...userCondition, ...searchCondition,
                        jc_id: { [Op.ne]: null }
                    },
                    // limit,
                    // offset,
                    order: [["id", "DESC"]],
                    include: [
                        {
                            model: JobCard,
                            as: "jobcard",
                            include: [
                                {
                                    model: Vehicle,
                                    as: "vehicle",
                                    include: [
                                        { model: Model, as: 'model', attributes: ['modelName'] },
                                        { model: Make, as: 'make', attributes: ['makeName'] }
                                    ],
                                    attributes: ['engineNumber', 'chassisNumber', 'registrationNumber']
                                },
                            ],
                        },
                        { model: Outlet, as: 'outlet', attributes: ['outletCode'] }
                    ]
                };
            } else {
                queryOptions = {
                    where: {
                        ...userCondition, ...searchCondition, lead_id: { [Op.ne]: null }
                    },
                    // limit,
                    // offset,
                    order: [["id", "DESC"]],
                    include: [
                        {
                            model: Leads,
                            as: "lead",
                            include: [
                                {
                                    model: Vehicle,
                                    as: "vehicle",
                                    include: [
                                        { model: Model, as: 'model', attributes: ['modelName'] },
                                        { model: Make, as: 'make', attributes: ['makeName'] }
                                    ],
                                    attributes: ['engineNumber', 'chassisNumber', 'registrationNumber']
                                },
                            ],
                        },
                        { model: Outlet, as: 'outlet', attributes: ['outletCode'] }
                    ]
                };
            }

            // const rows = await ServiceReminderAlert.findAll(queryOptions);

            // return rows;
        };

        // if (reqData.limit && reqData.offset !== undefined) {
        //     queryOptions.limit = reqData.limit;
        //     queryOptions.offset = reqData.offset;
        // };

        const rows = await ServiceReminderAlert.findAll(queryOptions);

        return rows;
    } catch (err) {
        logger.error('Service Reminder Alert dao getServiceReminderData', err);
    };
};

const dao = {
    createServiceReminder,
    listServiceReminderAlert,
    getServiceReminderAlert,
    getServiceReminderData
};

export default dao;

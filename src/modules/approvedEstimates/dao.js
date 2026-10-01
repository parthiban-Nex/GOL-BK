import db from '../index.js';
import logger from '../../config/logger.js';
import { Op, literal, fn, col } from 'sequelize';

const JobCard = db.jobCard;
const Schedules = db.schedules;
const OslSchedules = db.oslSchedules;
const PartsIssue = db.partsIssue;
const Vehicle = db.vehicles;
const Model = db.models;
const Make = db.makes;
const Source = db.sources;
const Sourcetypes = db.sourcetypes;
const PartsIndent = db.partsIndent;

const listApprovedEstimates = async(reqData, user) => {
    try{
        const { searchKey, offset, limit } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { customer_name: {[Op.like]: `%${searchKey}%`}},
                { reg_no: {[Op.like]: `%${searchKey}%`}},
                { job_card_no: {[Op.like]: `%${searchKey}%`}},
            ]
        }: {};
        let combinedCondition = {};
        if (user.reportAccess == 1){ 
            combinedCondition = {
                ...searchCondition, outlet_id: {
                    [Op.in]: literal(
                        `(SELECT outlet_id FROM employee_outlet_map WHERE emp_id = ${user.employeeId})`
                    )
                },
                status: {
                    [Op.or]: [1,2]
                }
            };
        }
        else {
            combinedCondition = {
                ...searchCondition, 
                outlet_id: user.outlet.id,
                status: {
                    [Op.or]: [1,2]
                }
            };
        }
        const count = await JobCard.count({
            where: combinedCondition,
        });
        let rows = await JobCard.findAll({
            where: combinedCondition,
            limit,
            offset,
            order: [['id', 'DESC']],
            include: [
                { model: Schedules, as: 'schedules' },
                { model: OslSchedules, as: 'oslSchedules'},
                { model: PartsIssue, as: 'partsIssue'},
                { model: PartsIndent, as: "partsIndent" },
                {
                    model: Vehicle,
                    as: 'vehicle',
                    attributes: ['chassisNumber'],
                    include: [
                      { model: Model, as: 'model', attributes:['modelName']},
                      { model: Make, as: 'make', attributes:['makeName'] },
                    ],
                },
                {
                    model: Sourcetypes, as: 'sourcetype',
                    attributes: ['sourceTypeName']
                },
                {
                    model: Source, as: 'sources',
                    attributes: ['sourceName']
                }
            ],
            attributes: {
                include: [[fn('DATE_FORMAT', col('createdAt'), '%d-%m-%Y %H:%i:%s'), 'formatted_created_date']]
            }
        });

        return { rows , count };
    } catch (err) {
        logger.error('Approved Estimates listApprovedEstimates dao', err);
    };
};

const setApprovalStatus = async (reqData, user) => {
    let data = "failed";
    const date = new Date();
    try {
        console.log(reqData);
        for (const item of reqData) {
            if(item.type === 'schedules'){
                await Schedules.update({
                    status: item.status,
                    updated_by: user.id,
                    approveDatetime: item.status === 2 || item.status === 3 ? date : null
                },{ where: {id: item.id}})
            }
            else if(item.type === 'oslSchedules'){
                await OslSchedules.update({
                    status: item.status,
                    updated_by: user.id,
                    approveDatetime: item.status === 2 || item.status === 3 ? date : null
                },{ where: {id: item.id}})
            }
            else if(item.type === 'partsIndent'){
                await PartsIndent.update({
                    status: item.status,
                    updated_by: user.id,
                    approveDatetime: item.status === 2 || item.status === 3 ? date : null
                },{ where: {id: item.id}})
            }
        };
        data="success";
        return data;
    } catch (err) {
        logger.error('Approved Estimates setApprovalStatus dao', err);
    }
    return data;
}


const approvedEstimatesDAO = {
    listApprovedEstimates,
    setApprovalStatus
};

export default approvedEstimatesDAO;
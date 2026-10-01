import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Scheme = db.scheme;
const SchemeLabors = db.schemeLabor;
const SchemeParts = db.schemePart;
const Make = db.makes;
const Model = db.models;

const createScheme = async (scheme, user) => {
    let data = {};
    try {
        data = await Scheme.create({
            repair_type_id: scheme.repairTypeId,
            repair_type_name: scheme.repairTypeName,
            scheme_name: scheme.schemeName,
            scheme_period: scheme.schemePeriod,
            scheme_amount: scheme.schemeAmount,
            status: scheme.status,
            hsnCode: scheme.hsnCode,
            tax_percentage: scheme.taxPercentage,
            cgst_tax: scheme.cgst,
            sgst_tax: scheme.sgst,
            igst_tax: scheme.igst,
            makeId: scheme.makeId,
            modelId: scheme.modelId,
            discount: scheme.discount,
            createdBy: user.id,
        });
    } catch (err) {
        logger.error('Scheme dao createScheme', err);
    };

    return data.id;
};

const getSchemeData = async (reqData) => {
    let count = {};
    let rows = [];
    try {
        const { searchKey, offset, limit, repairTypeId } = reqData;
        const searchCondition = searchKey ? {
            [Op.or]: [
                { repair_type_name: { [Op.like]: `%${searchKey}%` } },
                { scheme_name: { [Op.like]: `%${searchKey}%` } },
                { scheme_amount: { [Op.like]: `%${searchKey}%` } },
            ],
            repair_type_id: repairTypeId
        } : { repair_type_id: repairTypeId };
        count = await Scheme.count({
            where: searchCondition
        });
        rows = await Scheme.findAll({
            where: { ...searchCondition },
            limit: limit,
            offset: offset,
            order: [["id", "DESC"]],
            include: [
                { model: SchemeLabors, as: 'labours' },
                { model: SchemeParts, as: 'parts' },
                { model: Make, as: 'make', attributes: ['makeName'] },
                { model: Model, as: 'model', attributes: ['modelName'] }
            ]
        });
        if (!Array.isArray(rows)){
            rows = [];
        }
    } catch (err) {
        logger.error('Scheme dao getSchemeData', err);
    };

    return {
        totalScheme: count, data: rows
    };
};

const createSchemeLabor = async (scheme, user) => {
    let data = {};
    try {
        for (const schemeLabor of scheme) {
            data = await SchemeLabors.create({
                labor_id: schemeLabor.labourId ? schemeLabor.labourId : null,
                labor_code: schemeLabor.labourCode,
                scheme_id: schemeLabor.schemeId,
                labour_description: schemeLabor.labourDescription,
                labor_amount: schemeLabor.labourAmount,
                count: schemeLabor.count,
                createdBy: user.id,
            });
        }
    } catch (err) {
        logger.error('Scheme dao createScheme', err);
    };

    return data.id;
};

const getSchemeLaborData = async (reqData) => {
    let rows = {};
    try {
        rows = await SchemeLabors.findAll({
            where: { labor_code: reqData.laborCode },
            order: [["id", "DESC"]]
        });
    } catch (err) {
        logger.error('Scheme dao getSchemeLaborData', err);
    };

    return rows;
};

const createSchemePart = async (scheme, user) => {
    let data = {};
    try {
        for (const schemePart of scheme) {
            data = await SchemeParts.create({
                part_id: schemePart.partId ? schemePart.partId : null,
                part_code: schemePart.partCode,
                part_description: schemePart.partDescription,
                scheme_id: schemePart.schemeId,
                part_amount: schemePart.partAmount,
                count: schemePart.count,
                createdBy: user.id,
            });
        }
    } catch (err) {
        logger.error('Scheme dao createScheme', err);
    };

    return data.id;
};

const getSchemePartData = async (reqData) => {
    let rows = {};
    try {
        rows = await SchemeParts.findAll({
            where: { part_code: reqData.partCode },
            order: [["id", "DESC"]]
        });
    } catch (err) {
        logger.error('Scheme dao getSchemeLaborData', err);
    };

    return rows;
};

const deleteSchemePart = async (id) => {
    let rows = {};
    try {
        rows = await SchemeParts.destroy({
            where: { scheme_id: id }
        })
    } catch (err) {
        logger.error('Scheme dao deleteSchemePart', err);
    }
    return rows;
}

const deleteLaborPart = async (id) => {
    let rows = {};
    try {
        rows = await SchemeLabors.destroy({
            where: { scheme_id: id }
        })
    } catch (err) {
        logger.error('Scheme dao deleteLaborPart', err);
    }
    return rows;
}

const schemeDao = {
    createScheme,
    getSchemeData,
    createSchemeLabor,
    getSchemeLaborData,
    createSchemePart,
    getSchemePartData,
    deleteSchemePart,
    deleteLaborPart
};

export default schemeDao;

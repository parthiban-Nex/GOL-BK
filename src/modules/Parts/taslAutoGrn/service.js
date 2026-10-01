import logger from '../../../config/logger.js';
import TaslAutoGrnDao from './dao.js';
import { Op } from 'sequelize';

const GetTaslAutoGrn = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;

    const outletCode = user?.outlet?.outletCode;
    const company_id = user?.outlet?.companyId;

    if (!outletCode) {
      throw new Error('Outlet code not found for user');
    }
    if (company_id !== 1) {
      return { 
        grnDetails: [], 
        count: 0 
      };
    }
    const searchCondition = searchKey
      ? {
          [Op.or]: [
            { invoice_no: { [Op.like]: `%${searchKey}%` } },
            { customer_code: { [Op.like]: `%${searchKey}%` } }
          ]
        }
      : {};

    return await TaslAutoGrnDao.fetchTaslAutoGrn({
      searchCondition,
      outletCode,
      offset,
      limit
    });

  } catch (err) {
    logger.error('TaslAutoGrn Service Error:', err);
    throw err;
  }
};

const GetTaslAutoGrnForGateIn = async (reqData, user) => {
  try {
    const { id } = reqData;

    if (!id) {
      throw new Error('CounterSales id is required');
    }

    return await TaslAutoGrnDao.fetchTaslAutoGrnForGateIn(id);
  } catch (err) {
    logger.error('TaslAutoGrn For GRN Service Error:', err);
    throw err;
  }
};

export default {
  GetTaslAutoGrn, GetTaslAutoGrnForGateIn
};

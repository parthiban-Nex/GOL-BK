import db from '../../index.js';
import logger from '../../../config/logger.js';
import { Op } from 'sequelize';

const CounterSales = db.countersale;
const Outlet = db.outlets;
const Grns = db.grns;
const CounterSaleParts = db.countersalepart;

const fetchTaslAutoGrn = async ({
  searchCondition,
  outletCode,
  offset,
  limit
}) => {
  try {
    const whereCondition = {
      customer_code: {
        [Op.like]: `%${outletCode}%`
      },
      ...searchCondition
    };

    const data = await CounterSales.findAll({
      where: whereCondition,
      attributes: [
        'id',
        'customer_code',
        'invoice_number',
        'createdAt',
        'outlet_id'
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    const count = await CounterSales.count({ where: whereCondition });

    const outletIds = data.map(d => d.outlet_id);
    const outlets = await Outlet.findAll({
      where: { id: outletIds },
      attributes: ['id', 'outletCode']
    });

    const outletMap = {};
    outlets.forEach(o => {
      outletMap[o.id] = o.outletCode;
    });

    const invoiceNumbers = data.map(d => d.invoice_number);

    const grnInvoices = await Grns.findAll({
      where: {
        invoice_number: {
          [Op.in]: invoiceNumbers
        }
      },
      attributes: ['invoice_number']
    });

    const grnInvoiceSet = new Set(
      grnInvoices.map(g => g.invoice_number)
    );

    const grnDetails = data.map(d => ({
      ...d.toJSON(),
      outletCode: outletMap[d.outlet_id] || null,
      inward_status: grnInvoiceSet.has(d.invoice_number)
        ? 'Completed'
        : 'Open'
    }));

    return { grnDetails, count };

  } catch (err) {
    logger.error('CounterSales DAO Error:', err);
    throw err;
  }
};
const fetchTaslAutoGrnForGateIn = async (id) => {
  try {
    const data = await CounterSales.findOne({
      where: { id },
      attributes: [
        'id',
        'invoice_number',
        'customer_code',
        'createdAt',
        'grand_total'
      ],
      include: [
        {
          model: CounterSaleParts,
          as: 'countersale_parts',
          attributes: [
            'id',
            'item_code',
            'item_description',
            'quantity',
            'rate',
            'cost',
            'mrp',
            'cgst',
            'sgst',
            'igst',
            'total',
            'discount'
          ]
        }
      ]
    });

    return data;
  } catch (err) {
    logger.error('Tasl Auto GRN Parts DAO Error:', err);
    throw err;
  }
};


export default {
  fetchTaslAutoGrn, fetchTaslAutoGrnForGateIn
};

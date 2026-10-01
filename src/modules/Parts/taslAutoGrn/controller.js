import logger from '../../../config/logger.js';
import TaslAutoGrnService from './service.js';
import auditLog from '../../../shared/auditLog.js';

const GetTaslAutoGrn = async (req, res, next) => {
  const auditData = {};
  auditData.menu_name = 'GRN';
  auditData.submenu_name = 'TASL Auto GRN';

  try {
    const { grnDetails, count } =
      await TaslAutoGrnService.GetTaslAutoGrn(req.body, req.user);

    auditData.action = 'Get';
    auditData.result = 'success';
    auditData.message = 'Fetched TASL Auto GRN list';
    auditLog.createAuditLog(req, auditData);

    const responseData = grnDetails.map(item => {
      const date = item.createdAt.toISOString();
      const dateformat =
        date.slice(8, 10) + '-' +
        date.slice(5, 7) + '-' +
        date.slice(0, 4);

      return {
        id: item.id,
        invoice_number: item.invoice_number,
        from: item.outletCode,
        to: item.customer_code,
        inward_status: item.inward_status,
        createdDate: dateformat
      };
    });

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Tasl Auto GRN data fetched successfully',
      data: responseData,
      count
    });

  } catch (err) {
    auditData.action = 'Get';
    auditData.result = 'failed';
    auditData.message = 'Failed to fetch TASL Auto GRN list';
    auditLog.createAuditLog(req, auditData);

    logger.error('TaslAutoGrn Controller Error:', err);
    next(err);
  }
};

const GetTaslAutoGrnForGateIn = async (req, res, next) => {
  const auditData = {};
  auditData.menu_name = 'GRN';
  auditData.submenu_name = 'TASL Auto GRN';

  try {
    const data =
      await TaslAutoGrnService.GetTaslAutoGrnForGateIn(req.body, req.user);

    if (!data) {
      auditData.action = 'Get';
      auditData.result = 'failed';
      auditData.message = 'No Counter Sales data found for Gate In';
      auditLog.createAuditLog(req, auditData);

      return res.status(404).json({
        requestSuccessful: false,
        message: 'No Counter Sales data found'
      });
    }

    auditData.action = 'Get';
    auditData.result = 'success';
    auditData.message = 'Fetched TASL Auto GRN Gate In details';
    auditLog.createAuditLog(req, auditData);

    const { countersale_parts, ...saleData } = data.dataValues;

    const partmap = countersale_parts.map(item => {
      const val = item.dataValues;
      return {
        id: val.id,
        "Parts Code": val.item_code,
        Description: val.item_description,
        Cost: val.cost,
        MRP: val.mrp,
        "Received Qty": val.quantity,
        "Sup. inv qty": val.quantity,
        Rate: val.rate,
        CGST: val.cgst ?? 0,
        SGST: val.sgst ?? 0,
        IGST: val.igst ?? 0,
        "Total Amount": val.total,
        Discount: val.Discount
      };
    });

    return res.status(200).json({
      requestSuccessful: true,
      message: 'Tasl Auto GRN parts fetched successfully',
      partdata: partmap,
      salesdata: saleData
    });

  } catch (err) {
    auditData.action = 'Get';
    auditData.result = 'failed';
    auditData.message = 'Error while fetching TASL Auto GRN Gate In details';
    auditLog.createAuditLog(req, auditData);

    logger.error('TaslAutoGrn For GRN Controller Error:', err);
    next(err);
  }
};



export default {
  GetTaslAutoGrn, GetTaslAutoGrnForGateIn
};

import db from '../index.js';
import logger from '../../config/logger.js';
import { QueryTypes } from 'sequelize';

const sequelize = db.sequelize;

/**
 * Service Advisor leaderboard rows: per SA (users.id) per outlet,
 * labour revenue (excl. tax) split by RJC / AJC document_type, for the given month.
 */
const serviceAdvisorRows = async (outletIds, { start, end, offset = 0, limit = 5 }) => {
  try {
    // labour = SUM(schedules.amount) per txn; month = billings.createdAt.
    // // Base grouped query. HAVING drops zero-activity SAs (was a JS filter in service.js).
    const base = `
      SELECT u.id AS saId, e.employeeCode AS code, e.employeeName AS name,
             t.outlet_id AS outletId, o.outletCode AS outletCode,
             SUM(CASE WHEN t.document_type = 'AJC' THEN IFNULL(sc.lab, 0) ELSE 0 END) AS ajcLabour,
             COUNT(DISTINCT CASE WHEN t.document_type = 'AJC' THEN t.id END) AS ajcCount,
             SUM(CASE WHEN t.document_type = 'RJC' THEN IFNULL(sc.lab, 0) ELSE 0 END) AS rjcLabour,
             COUNT(DISTINCT CASE WHEN t.document_type = 'RJC' THEN t.id END) AS rjcCount
      FROM transactions t
      JOIN users u ON u.id = CAST(t.assigned_sa_id AS UNSIGNED)
      LEFT JOIN employees e ON e.id = u.employeeId
      LEFT JOIN outlets o ON o.id = t.outlet_id
      LEFT JOIN (SELECT transaction_id, SUM(amount) AS lab FROM schedules GROUP BY transaction_id) sc ON sc.transaction_id = t.id
      WHERE t.outlet_id IN (:outletIds)
        AND o.companyId IN (2, 5, 8)
        AND t.assigned_sa_id IS NOT NULL AND t.assigned_sa_id <> ''
        AND EXISTS (SELECT 1 FROM billings b WHERE b.transaction_id = t.id AND b.createdAt BETWEEN :start AND :end)
      GROUP BY u.id, e.employeeCode, e.employeeName, t.outlet_id, o.outletCode
      HAVING (ajcLabour + rjcLabour) > 0
    `;
    // Wrap in a derived table so ORDER BY can use the aggregate columns in an expression
    // (MySQL rejects arithmetic over aggregate aliases directly in ORDER BY).
    const rows = await sequelize.query(
      `SELECT x.* FROM (${base}) x ORDER BY (x.ajcLabour + x.rjcLabour) DESC, x.saId ASC LIMIT :limit OFFSET :offset`,
      { replacements: { outletIds, start, end, limit: Number(limit), offset: Number(offset) }, type: QueryTypes.SELECT },
    );
    const countRes = await sequelize.query(
      `SELECT COUNT(*) AS total FROM (${base}) x`,
      { replacements: { outletIds, start, end }, type: QueryTypes.SELECT },
    );
    return { rows, total: Number(countRes[0]?.total) || 0 };
  } catch (err) {
    logger.error('leaderboard dao serviceAdvisorRows', err);
    throw err;
  }
};

/**
 * Technician leaderboard rows: per technician (employees.id via schedule_mechanics),
 */
const technicianRows = async (outletIds, { start, end, offset = 0, limit = 5 }) => {
  try {
    const base = `
      SELECT e.id AS techId, e.employeeCode AS code, e.employeeName AS name,
             t.outlet_id AS outletId, o.outletCode AS outletCode,
             SUM(CASE WHEN t.document_type = 'AJC' THEN s.amount ELSE 0 END) AS ajcLabour,
             COUNT(DISTINCT CASE WHEN t.document_type = 'AJC' THEN s.transaction_id END) AS ajcCount,
             SUM(CASE WHEN t.document_type = 'RJC' THEN s.amount ELSE 0 END) AS rjcLabour,
             COUNT(DISTINCT CASE WHEN t.document_type = 'RJC' THEN s.transaction_id END) AS rjcCount
      FROM schedule_mechanics sm
      JOIN schedules s ON s.id = sm.schedule_id AND s.transaction_id = sm.transaction_id
      JOIN transactions t ON t.id = s.transaction_id
      JOIN employees e ON e.id = sm.mechanic_id
      LEFT JOIN outlets o ON o.id = t.outlet_id
      WHERE t.outlet_id IN (:outletIds)
        AND o.companyId IN (2, 5, 8)
        AND EXISTS (SELECT 1 FROM billings b WHERE b.transaction_id = t.id AND b.createdAt BETWEEN :start AND :end)
      GROUP BY e.id, e.employeeCode, e.employeeName, t.outlet_id, o.outletCode
      HAVING (ajcLabour + rjcLabour) > 0
    `;
    // Wrap in a derived table so ORDER BY can use the aggregate columns in an expression
    // (MySQL rejects arithmetic over aggregate aliases directly in ORDER BY).
    const rows = await sequelize.query(
      `SELECT x.* FROM (${base}) x ORDER BY (x.ajcLabour + x.rjcLabour) DESC, x.techId ASC LIMIT :limit OFFSET :offset`,
      { replacements: { outletIds, start, end, limit: Number(limit), offset: Number(offset) }, type: QueryTypes.SELECT },
    );
    const countRes = await sequelize.query(
      `SELECT COUNT(*) AS total FROM (${base}) x`,
      { replacements: { outletIds, start, end }, type: QueryTypes.SELECT },
    );
    return { rows, total: Number(countRes[0]?.total) || 0 };
  } catch (err) {
    logger.error('leaderboard dao technicianRows', err);
    throw err;
  }
};

/**
 * Parts Incharge leaderboard rows: ONE person per outlet — the person who created the most
 * recent indent (parts_indent.created_by of the highest id) for that outlet in the given month.
 * Shows that person's monthly total indented vs issued qty; the row always shows (no issued>0 gate).
 */
const partsInchargeRows = async (outletIds, { start, end, offset = 0, limit = 5 }) => {
  try {
    // Restrict to each outlet's last-created indent's creator via a group-wise-max (MAX(id)) join,
    // then sum that person's month totals. HAVING keeps indented>0 (issued>0 gate dropped so the row always shows).
    const base = `
      SELECT u.id AS pid, e.employeeCode AS code, e.employeeName AS name,
             t.outlet_id AS outletId, o.outletCode AS outletCode,
             COALESCE(SUM(pi.request_quantity), 0) AS indented,
             COALESCE(SUM(iss.qty), 0) AS issued
      FROM parts_indent pi
      JOIN transactions t ON t.id = pi.transaction_id
      JOIN (
        SELECT lp_t.outlet_id AS outletId, lp_pi.created_by AS createdBy
        FROM parts_indent lp_pi
        JOIN transactions lp_t ON lp_t.id = lp_pi.transaction_id
        JOIN (
          SELECT t8.outlet_id AS oid, MAX(pi8.id) AS mxid
          FROM parts_indent pi8
          JOIN transactions t8 ON t8.id = pi8.transaction_id
          WHERE t8.outlet_id IN (:outletIds) AND pi8.createdAt BETWEEN :start AND :end
          GROUP BY t8.outlet_id
        ) mx ON mx.oid = lp_t.outlet_id AND mx.mxid = lp_pi.id
      ) lp ON lp.outletId = t.outlet_id AND lp.createdBy = pi.created_by
      LEFT JOIN (
        SELECT indent_id, SUM(quantity) AS qty FROM parts_issues GROUP BY indent_id
      ) iss ON iss.indent_id = pi.id
      JOIN users u ON u.id = pi.created_by
      LEFT JOIN employees e ON e.id = u.employeeId
      LEFT JOIN outlets o ON o.id = t.outlet_id
      WHERE t.outlet_id IN (:outletIds)
        AND o.companyId IN (2, 5, 8)
        AND pi.createdAt BETWEEN :start AND :end
      GROUP BY u.id, e.employeeCode, e.employeeName, t.outlet_id, o.outletCode
      HAVING indented > 0
    `;
    // Wrap in a derived table for a stable ORDER BY over the aggregate columns.
    const rows = await sequelize.query(
      `SELECT x.* FROM (${base}) x ORDER BY x.issued DESC, x.pid ASC LIMIT :limit OFFSET :offset`,
      { replacements: { outletIds, start, end, limit: Number(limit), offset: Number(offset) }, type: QueryTypes.SELECT },
    );
    const countRes = await sequelize.query(
      `SELECT COUNT(*) AS total FROM (${base}) x`,
      { replacements: { outletIds, start, end }, type: QueryTypes.SELECT },
    );
    return { rows, total: Number(countRes[0]?.total) || 0 };
  } catch (err) {
    logger.error('leaderboard dao partsInchargeRows', err);
    throw err;
  }
};

/**
 * Monthly labour targets keyed by users.id (SA) and outlet.
 * monthly_targets has no month/year column, so this is the standing target row(s).
 */
const labourTargetsByUser = async (outletIds) => {
  try {
    const query = `
      SELECT user_id AS userId, outlet_id AS outletId,
             SUM(COALESCE(target_labours_to_rjc, 0) + COALESCE(target_labours_to_ajc, 0)) AS target
      FROM monthly_targets
      WHERE outlet_id IN (:outletIds)
      GROUP BY user_id, outlet_id
    `;
    return await sequelize.query(query, {
      replacements: { outletIds },
      type: QueryTypes.SELECT,
    });
  } catch (err) {
    logger.error('leaderboard dao labourTargetsByUser', err);
    throw err;
  }
};

/**
 * Same labour targets but keyed by employeeId (for technicians, whose id is employees.id).
 */
const labourTargetsByEmployee = async (outletIds) => {
  try {
    const query = `
      SELECT u.employeeId AS empId, mt.outlet_id AS outletId,
             SUM(COALESCE(mt.target_labours_to_rjc, 0) + COALESCE(mt.target_labours_to_ajc, 0)) AS target
      FROM monthly_targets mt
      JOIN users u ON u.id = mt.user_id
      WHERE mt.outlet_id IN (:outletIds)
      GROUP BY u.employeeId, mt.outlet_id
    `;
    return await sequelize.query(query, {
      replacements: { outletIds },
      type: QueryTypes.SELECT,
    });
  } catch (err) {
    logger.error('leaderboard dao labourTargetsByEmployee', err);
    throw err;
  }
};

/** Active outlets for the state / outlet filters. */
const activeOutlets = async () => {
  try {
    const query = `
      SELECT id, outletCode, outletName, state
      FROM outlets
      WHERE status = 1 AND companyId IN (2, 5, 8)
      ORDER BY state, outletCode
    `;
    return await sequelize.query(query, { type: QueryTypes.SELECT });
  } catch (err) {
    logger.error('leaderboard dao activeOutlets', err);
    throw err;
  }
};

const dao = {
  serviceAdvisorRows,
  technicianRows,
  partsInchargeRows,
  labourTargetsByUser,
  labourTargetsByEmployee,
  activeOutlets,
};

export default dao;

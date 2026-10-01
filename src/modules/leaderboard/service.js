import LeaderboardDao from './dao.js';
import logger from '../../config/logger.js';

const pad = (n) => n.toString().padStart(2, '0');

/** Resolve month/year (1-based month) from body, defaulting to current month. */
const resolvePeriod = (body) => {
  const now = new Date();
  const month = body && body.month ? parseInt(body.month, 10) : now.getMonth() + 1;
  const year = body && body.year ? parseInt(body.year, 10) : now.getFullYear();
  const start = `${year}-${pad(month)}-01 00:00:00`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)} 23:59:59`;
  return { month, year, start, end };
};

const toOutletIds = (body) =>
  (Array.isArray(body?.outletIds) ? body.outletIds : [])
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id));

/** Resolve offset/limit for server-side pagination (defaults: offset 0, 5 rows/page). */
const resolvePaging = (body) => {
  const limit = parseInt(body?.limit, 10);
  const offset = parseInt(body?.offset, 10);
  return {
    limit: Number.isNaN(limit) || limit <= 0 ? 5 : limit,
    offset: Number.isNaN(offset) || offset < 0 ? 0 : offset,
  };
};

const num = (v) => Number(v) || 0;

// Unused since pagination moved sort+rank into SQL (ORDER BY … LIMIT/OFFSET, rank = offset+i+1). Kept for reference.
// const rankAndSort = (rows, valueKey) => {
//   rows.sort((a, b) => b[valueKey] - a[valueKey]);
//   rows.forEach((r, i) => { r.rank = i + 1; });
//   return rows;
// };

const serviceAdvisor = async (body) => {
  const outletIds = toOutletIds(body);
  const { offset, limit } = resolvePaging(body);
  if (!outletIds.length) return { ...periodMeta(body), data: [], total: 0, offset, limit };
  const period = resolvePeriod(body);

  // dao returns one already-filtered, already-ranked page of rows + the full total count.
  const [{ rows, total }, targets] = await Promise.all([
    LeaderboardDao.serviceAdvisorRows(outletIds, { ...period, offset, limit }),
    LeaderboardDao.labourTargetsByUser(outletIds),
  ]);

  const targetMap = new Map();
  targets.forEach((t) => targetMap.set(`${t.userId}_${t.outletId}`, num(t.target)));

  const data = rows.map((r, i) => {
    const ajcLabour = num(r.ajcLabour);
    const rjcLabour = num(r.rjcLabour);
    const achieved = ajcLabour + rjcLabour;
    const target = targetMap.get(`${r.saId}_${r.outletId}`) || 0;
    return {
      id: r.saId,
      code: r.code,
      name: r.name,
      outletId: r.outletId,
      outletCode: r.outletCode,
      ajcLabour, ajcCount: num(r.ajcCount),
      rjcLabour, rjcCount: num(r.rjcCount),
      achieved, achievedCount: num(r.ajcCount) + num(r.rjcCount),
      target,
      balance: target - achieved,
      rank: offset + i + 1, // global rank across pages (SQL orders by achieved desc)
    };
  });

  return { ...period, data, total, offset, limit };
};

const technician = async (body) => {
  const outletIds = toOutletIds(body);
  const { offset, limit } = resolvePaging(body);
  if (!outletIds.length) return { ...periodMeta(body), data: [], total: 0, offset, limit };
  const period = resolvePeriod(body);

  const [{ rows, total }, targets] = await Promise.all([
    LeaderboardDao.technicianRows(outletIds, { ...period, offset, limit }),
    LeaderboardDao.labourTargetsByEmployee(outletIds),
  ]);

  const targetMap = new Map();
  targets.forEach((t) => targetMap.set(`${t.empId}_${t.outletId}`, num(t.target)));

  const data = rows.map((r, i) => {
    const ajcLabour = num(r.ajcLabour);
    const rjcLabour = num(r.rjcLabour);
    const achieved = ajcLabour + rjcLabour;
    const target = targetMap.get(`${r.techId}_${r.outletId}`) || 0;
    return {
      id: r.techId,
      code: r.code,
      name: r.name,
      outletId: r.outletId,
      outletCode: r.outletCode,
      ajcLabour, ajcCount: num(r.ajcCount),
      rjcLabour, rjcCount: num(r.rjcCount),
      achieved, achievedCount: num(r.ajcCount) + num(r.rjcCount),
      target,
      balance: target - achieved,
      rank: offset + i + 1, // global rank across pages (SQL orders by achieved desc)
    };
  });

  return { ...period, data, total, offset, limit };
};

const partsIncharge = async (body) => {
  const outletIds = toOutletIds(body);
  const { offset, limit } = resolvePaging(body);
  if (!outletIds.length) return { ...periodMeta(body), data: [], total: 0, offset, limit };
  const period = resolvePeriod(body);

  // dao filters (indented>0 AND issued>0) and orders by issued desc, then pages.
  const { rows, total } = await LeaderboardDao.partsInchargeRows(outletIds, { ...period, offset, limit });

  const data = rows.map((r, i) => {
    const indented = num(r.indented);
    const issued = num(r.issued);
    const fulfillment = indented > 0 ? Math.round((issued / indented) * 1000) / 10 : 0;
    return {
      id: r.pid,
      code: r.code,
      name: r.name,
      outletId: r.outletId,
      outletCode: r.outletCode,
      indented,
      issued,
      fulfillment,
      rank: offset + i + 1, // global rank across pages (SQL orders by issued desc)
    };
  });

  return { ...period, data, total, offset, limit };
};

const filters = async () => {
  const outlets = await LeaderboardDao.activeOutlets();
  const states = [...new Set(outlets.map((o) => o.state).filter(Boolean))].sort();
  return {
    states,
    outlets: outlets.map((o) => ({
      id: o.id,
      outletCode: o.outletCode,
      outletName: o.outletName,
      state: o.state,
    })),
  };
};

// meta helper for the empty-selection short-circuit
function periodMeta(body) {
  const { month, year } = resolvePeriod(body);
  return { month, year };
}

const service = { serviceAdvisor, technician, partsIncharge, filters };
export default service;

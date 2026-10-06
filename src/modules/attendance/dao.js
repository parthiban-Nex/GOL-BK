
import db from '../index.js';
import { Op } from 'sequelize';
import logger from '../../config/logger.js';

const Attendance = db.attendance;
const Regularisation = db.attendanceRegularisations;
const Employee = db.employees;
const EmployeeRole = db.employeeroles;

function getInitials(name = '') {
    return name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .slice(0, 2)
        .join('');
}


const getEmployeesUnderManager = async (user = {}, params = {}) => {
    const outletId =
        user?.outlet?.id ||
        user?.outletId ||
        (typeof user?.outlet === 'number' || (typeof user?.outlet === 'string' && !isNaN(user.outlet)) ? user.outlet : null) ||
        params.outletId;

    if (!Employee) return [];

    const whereClause = { status: 1 };
    if (outletId) {
        whereClause.outletId = String(outletId);
    }

    try {
        const emps = await Employee.findAll({
            where: whereClause,
            include: EmployeeRole ? [{ model: EmployeeRole, as: 'employeerole' }] : [],
            order: [['employeeName', 'ASC']],
        });

        return emps.map((e) => ({
            id: e.employeeCode || `EMP${e.id}`,
            employeeCode: e.employeeCode || `EMP${e.id}`,
            name: e.employeeName,
            role: e.employeerole?.employeeRole || 'Technician',
            outletId: e.outletId,
            initials: getInitials(e.employeeName),
        }));
    } catch (e) {
        logger.warn('Error in getEmployeesUnderManager:', e.message);
        return [];
    }
};


const getUserOutletId = (user = {}) => {
    return (
        user?.outlet?.id ||
        user?.outletId ||
        (typeof user?.outlet === 'number' || (typeof user?.outlet === 'string' && !isNaN(user.outlet)) ? user.outlet : null)
    );
};

const getAuthorizedEmployeeMap = async (user = {}) => {
    const outletId = getUserOutletId(user);
    const map = new Map();
    if (!Employee) return { isRestricted: false, map, outletId: null };

    if (outletId) {
        try {
            const emps = await Employee.findAll({
                where: { outletId: String(outletId), status: 1 },
                attributes: ['id', 'employeeCode', 'employeeName', 'outletId'],
            });
            emps.forEach((e) => {
                if (e.employeeCode) map.set(String(e.employeeCode).trim().toLowerCase(), e);
                if (e.id) {
                    map.set(String(e.id).trim().toLowerCase(), e);
                    map.set(`emp${e.id}`.toLowerCase(), e);
                }
            });
            return { isRestricted: true, map, outletId: String(outletId) };
        } catch (e) {
            logger.warn('Error fetching authorized employees by outlet:', e.message);
        }
    }

    try {
        const emps = await Employee.findAll({
            where: { status: 1 },
            attributes: ['id', 'employeeCode', 'employeeName', 'outletId'],
            limit: 1000,
        });
        emps.forEach((e) => {
            if (e.employeeCode) map.set(String(e.employeeCode).trim().toLowerCase(), e);
            if (e.id) {
                map.set(String(e.id).trim().toLowerCase(), e);
                map.set(`emp${e.id}`.toLowerCase(), e);
            }
        });
        return { isRestricted: false, map, outletId: null };
    } catch (e) {
        logger.warn('Error fetching active employees:', e.message);
        return { isRestricted: false, map, outletId: null };
    }
};

const createRegularisation = async (payload, user = {}) => {
    const employeeId = payload.employeeId || user.employeeCode || (user.employeeId ? `EMP${user.employeeId}` : null);
    if (!employeeId) {
        const err = new Error('Employee ID is required for regularisation.');
        err.status = 400;
        throw err;
    }

    const { isRestricted, map, outletId: managerOutletId } = await getAuthorizedEmployeeMap(user);
    const empIdKey = String(employeeId).trim().toLowerCase();
    const empFromDb = map.get(empIdKey);

    const isSelf =
        (user.employeeCode && String(user.employeeCode).trim().toLowerCase() === empIdKey) ||
        (user.employeeId && (String(user.employeeId).trim().toLowerCase() === empIdKey || `emp${user.employeeId}`.toLowerCase() === empIdKey));

    if (isRestricted && !isSelf && !empFromDb && map.size > 0) {
        const err = new Error(`Unauthorized: You are not authorized to regularize attendance for employee '${employeeId}'.`);
        err.status = 403;
        throw err;
    }

    let employeeName = empFromDb?.employeeName || payload.employeeName;
    if (!employeeName && Employee) {
        try {
            const emp = await Employee.findOne({
                where: {
                    [Op.or]: [{ employeeCode: String(employeeId) }, { id: isNaN(employeeId) ? -1 : employeeId }],
                },
            });
            if (emp) {
                employeeName = emp.employeeName;
            }
        } catch (e) {
            logger.warn('Error fetching employee name for regularisation:', e.message);
        }
    }

    if (!employeeName) {
        employeeName = isSelf ? (user.employeeName || user.name || '') : (payload.employeeName || '');
    }

    const outletId = empFromDb?.outletId || managerOutletId || getUserOutletId(user) || payload.outletId || null;

    let regDate = payload.date;
    if (regDate && typeof regDate === 'string' && regDate.includes('T')) {
        regDate = regDate.split('T')[0];
    }
    if (!regDate) {
        regDate = new Date().toLocaleDateString('en-CA');
    }

    const localToday = new Date().toLocaleDateString('en-CA');
    if (regDate > localToday) {
        const err = new Error('Regularisation date cannot be in the future. Please select a past or current date.');
        err.status = 400;
        throw err;
    }

    const regType = payload.type || 'Forgot Punch';
    const regReason = (payload.reason || '').trim();
    if (!regReason) {
        const err = new Error('Reason is required for regularisation.');
        err.status = 400;
        throw err;
    }

    const created = await Regularisation.create({
        employeeId: String(employeeId),
        employeeName,
        outletId: outletId ? String(outletId) : null,
        date: regDate,
        type: regType,
        reason: regReason,
        attachmentUrl: payload.attachmentUrl || null,
        status: 'Approved',
        approvedBy: user.id || null,
        approvedAt: new Date(),
        createdBy: user.id || null,
    });

    const targetStatus = payload.targetStatus || payload.mark || 'P';
    const managerName = user.employeeName || user.name || '';
    const odDrNotes = (targetStatus === 'OD' || targetStatus === 'DR') ? ((payload.notes || payload.remarks || regReason || '').trim() || null) : null;
    if ((targetStatus === 'OD' || targetStatus === 'DR') && !odDrNotes) {
        const err = new Error(`Remarks are mandatory when regularising as ${targetStatus === 'OD' ? 'On Duty (OD)' : 'Duty Rest (DR)'}.`);
        err.status = 400;
        throw err;
    }

    try {
        await Attendance.upsert({
            employeeId: String(employeeId),
            employeeName,
            outletId: outletId ? String(outletId) : null,
            date: regDate,
            status: targetStatus,
            shift: payload.shift || '1st Shift',
            manager: managerName,
            notes: odDrNotes,
            createdBy: user.id || null,
            updatedBy: user.id || null,
        });
        logger.info(`Attendance immediately updated to '${targetStatus}' for regularisation #${created.id} on date ${regDate}`);
    } catch (e) {
        logger.error('Error auto-updating attendance on regularisation submit:', e);
    }

    return created;
};


const getTodayMarkList = async (params = {}, user = {}) => {
    const today = params.date || new Date().toISOString().split('T')[0];
    const shiftFilter = params.shift;

    const outletId =
        params.outletId ||
        user?.outlet?.id ||
        user?.outletId ||
        (typeof user?.outlet === 'number' || (typeof user?.outlet === 'string' && !isNaN(user.outlet)) ? user.outlet : null);

    const managerName = user?.employeeName || user?.name || '';

    let employeeList = [];
    if (Employee) {
        try {
            const whereClause = { status: 1 };
            if (outletId) {
                whereClause.outletId = String(outletId);
            }

            const emps = await Employee.findAll({
                where: whereClause,
                include: EmployeeRole ? [{ model: EmployeeRole, as: 'employeerole' }] : [],
                order: [['employeeName', 'ASC']],
            });

            if (emps && emps.length > 0) {
                employeeList = emps.map((e) => ({
                    id: e.employeeCode || `EMP${e.id}`,
                    employeeId: e.employeeCode || `EMP${e.id}`,
                    name: e.employeeName,
                    role: e.employeerole?.employeeRole || 'Technician',
                    manager: managerName,
                    shift: '1st Shift',
                    outletId: e.outletId,
                    initials: getInitials(e.employeeName),
                }));
            }
        } catch (e) {
            logger.warn('Error fetching employees from table in getTodayMarkList:', e.message);
        }
    }

    const empIds = employeeList.map((e) => e.id);
    const attendanceWhere = { date: today };
    if (outletId) {
        attendanceWhere[Op.or] = [
            { outletId: String(outletId) },
            { employeeId: { [Op.in]: empIds.length > 0 ? empIds : [''] } }
        ];
    } else if (empIds.length > 0) {
        attendanceWhere.employeeId = { [Op.in]: empIds };
    }

    const todayRecords = await Attendance.findAll({
        where: attendanceWhere,
    });

    const markMap = new Map();
    todayRecords.forEach((r) => {
        markMap.set(r.employeeId, r);
    });


    const results = employeeList.map((emp) => {
        const existing = markMap.get(emp.id) || markMap.get(emp.employeeId);
        return {
            id: emp.id,
            employeeId: emp.employeeId,
            name: emp.name,
            role: emp.role,
            manager: existing?.manager || emp.manager || managerName,
            shift: existing?.shift || emp.shift || '1st Shift',
            outletId: existing?.outletId || emp.outletId || outletId || null,
            initials: emp.initials || getInitials(emp.name),
            mark: existing ? existing.status : '',
            status: existing ? existing.status : '',
            notes: existing?.notes || '',
            date: today,
            checkIn: existing?.checkIn || null,
            checkOut: existing?.checkOut || null,
        };
    });

    if (shiftFilter && shiftFilter !== 'All' && shiftFilter !== 'All Shifts') {
        return results.filter((r) => r.shift === shiftFilter);
    }

    return results;
};

const saveMarksBulk = async (payload, user = {}) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const date = todayDate;
    const records = payload.records || payload.rows || (Array.isArray(payload) ? payload : []);
    const managerOutletId = getUserOutletId(user);
    const userId = user?.id || null;
    const managerName = user?.employeeName || user?.name || '';

    if (!records || records.length === 0) {
        return { count: 0, date, outletId: managerOutletId };
    }

       const { isRestricted, map, outletId: userOutletId } = await getAuthorizedEmployeeMap(user);

    const candidateEmpIds = records
        .map((r) => String(r.id || r.employeeId))
        .filter(Boolean);

    const existingAttendance = await Attendance.findAll({
        where: {
            date: date,
            employeeId: { [Op.in]: candidateEmpIds },
        },
        attributes: ['employeeId', 'status'],
    });

    const alreadyMarkedSet = new Set(
        existingAttendance
            .filter((a) => Boolean(a.status))
            .map((a) => String(a.employeeId).trim().toLowerCase())
    );

    const updates = [];
    for (const item of records) {
        if (!item.id && !item.employeeId) continue;
        const empId = item.id || item.employeeId;
        const mark = item.mark !== undefined ? item.mark : (item.status !== undefined ? item.status : '');
        if (!mark) continue;

        const empIdKey = String(empId).trim().toLowerCase();

        if (alreadyMarkedSet.has(empIdKey)) {
            logger.info(`Skipping already marked employee ${empId} for date ${date}. Changes must go through regularisation.`);
            continue;
        }

        const empFromDb = map.get(empIdKey);

        if (isRestricted && !empFromDb && map.size > 0) {
            logger.warn(`Security Warning: User ${user.id} (${user.employeeName}) attempted unauthorized attendance mark for employee: ${empId}`);
            const err = new Error(`Unauthorized: You are not authorized to mark attendance for employee '${empId}'`);
            err.status = 403;
            throw err;
        }

        const notesStr = (item.notes || item.remarks || '').trim();
        if ((mark === 'OD' || mark === 'DR') && !notesStr) {
            const err = new Error(`Remarks are mandatory for employee ${empId} when marking as ${mark === 'OD' ? 'On Duty (OD)' : 'Duty Rest (DR)'}.`);
            err.status = 400;
            throw err;
        }

        const shift = item.shift || '1st Shift';
        const finalManager = managerName || item.manager || 'Manager';
        const finalEmpName = empFromDb?.employeeName || item.name || item.employeeName || null;
        const finalEmpRole = item.role || item.employeeRole || null;
        const finalOutletId = empFromDb?.outletId || userOutletId || managerOutletId || null;
        const finalNotes = (mark === 'OD' || mark === 'DR') ? notesStr : null;

        updates.push(
            Attendance.upsert({
                employeeId: String(empId),
                employeeName: finalEmpName,
                employeeRole: finalEmpRole,
                outletId: finalOutletId ? String(finalOutletId) : null,
                date: date,
                status: mark,
                shift: shift,
                manager: finalManager,
                notes: finalNotes,
                createdBy: userId,
                updatedBy: userId,
            })
        );
    }

    await Promise.all(updates);
    return { count: updates.length, date, outletId: userOutletId || managerOutletId };
};

const getAnalytics = async (params = {}, user = {}) => {
    const period = params.period || '7D';
    const outletId =
        user?.outlet?.id ||
        user?.outletId ||
        (typeof user?.outlet === 'number' || (typeof user?.outlet === 'string' && !isNaN(user.outlet)) ? user.outlet : null) ||
        params.outletId;

    let totalEmployees = 0;
    if (Employee) {
        try {
            const empCount = await Employee.count({
                where: outletId ? { outletId: String(outletId), status: 1 } : { status: 1 },
            });
            totalEmployees = empCount;
        } catch (e) {
            logger.warn('Error counting employees for analytics:', e.message);
        }
    }

    const today = new Date();
    const buckets = [];

    if (params.from && params.to) {
        const fromMs = new Date(params.from).getTime();
        const toMs = new Date(params.to).getTime();
        const diffDays = Math.round((toMs - fromMs) / 86400000);

        if (diffDays <= 14) {
            for (let i = 0; i <= diffDays; i++) {
                const d = new Date(fromMs + i * 86400000);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                buckets.push({
                    week: `${dayName} (${dateStr.slice(5)})`,
                    date: dateStr,
                    from: dateStr,
                    to: dateStr,
                });
            }
        } else if (diffDays <= 90) {
            let cursor = new Date(fromMs);
            let weekNum = 1;
            while (cursor.getTime() <= toMs) {
                const weekStart = cursor.toISOString().split('T')[0];
                cursor.setDate(cursor.getDate() + 6);
                const weekEnd = new Date(Math.min(cursor.getTime(), toMs)).toISOString().split('T')[0];
                buckets.push({
                    week: `Week ${weekNum++}`,
                    from: weekStart,
                    to: weekEnd,
                });
                cursor.setDate(cursor.getDate() + 1);
            }
        } else {
            const fromDate = new Date(params.from);
            const toDate = new Date(params.to);
            let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
            while (cursor <= toDate) {
                const monthStart = cursor.toISOString().split('T')[0];
                const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).toISOString().split('T')[0];
                const clampedEnd = monthEnd > params.to ? params.to : monthEnd;
                const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                buckets.push({
                    week: monthLabel,
                    from: monthStart,
                    to: clampedEnd,
                });
                cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
            }
        }
    } else if (period === '7D') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
            buckets.push({
                week: `${dayName} (${dateStr.slice(5)})`,
                date: dateStr,
                from: dateStr,
                to: dateStr,
            });
        }
    } else if (period === '30D') {
        for (let w = 3; w >= 0; w--) {
            const endD = new Date(today);
            endD.setDate(today.getDate() - w * 7);
            const startD = new Date(endD);
            startD.setDate(endD.getDate() - 6);
            const fromStr = startD.toISOString().split('T')[0];
            const toStr = endD.toISOString().split('T')[0];
            buckets.push({
                week: `Week ${4 - w}`,
                from: fromStr,
                to: toStr,
            });
        }
    } else if (period === '3M') {
        for (let m = 2; m >= 0; m--) {
            const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
            const monthStart = d.toISOString().split('T')[0];
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
            const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            buckets.push({
                week: monthLabel,
                from: monthStart,
                to: monthEnd,
            });
        }
    } else if (period === '6M') {
        for (let m = 5; m >= 0; m--) {
            const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
            const monthStart = d.toISOString().split('T')[0];
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
            const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            buckets.push({
                week: monthLabel,
                from: monthStart,
                to: monthEnd,
            });
        }
    } else if (period === '1Y') {
        for (let m = 11; m >= 0; m--) {
            const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
            const monthStart = d.toISOString().split('T')[0];
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
            const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            buckets.push({
                week: monthLabel,
                from: monthStart,
                to: monthEnd,
            });
        }
    }

    let series = [];
    if (buckets.length > 0) {
        let minFrom = buckets[0].from;
        let maxTo = buckets[0].to;
        for (const b of buckets) {
            if (b.from < minFrom) minFrom = b.from;
            if (b.to > maxTo) maxTo = b.to;
        }

        const where = { date: { [Op.between]: [minFrom, maxTo] } };
        if (outletId) where.outletId = String(outletId);
        const records = await Attendance.findAll({
            where,
            attributes: ['date', 'status'],
        });

        const dateCountsMap = new Map();
        for (const r of records) {
            let item = dateCountsMap.get(r.date);
            if (!item) {
                item = { P: 0, A: 0, L: 0, DR: 0, OD: 0 };
                dateCountsMap.set(r.date, item);
            }
            if (item[r.status] !== undefined) {
                item[r.status]++;
            }
        }

        series = buckets.map((b) => {
            let present = 0;
            let absent = 0;
            let leave = 0;
            let dutyRest = 0;
            let onDuty = 0;

            for (const [dateStr, counts] of dateCountsMap.entries()) {
                if (dateStr >= b.from && dateStr <= b.to) {
                    present += counts.P;
                    absent += counts.A;
                    leave += counts.L;
                    dutyRest += counts.DR;
                    onDuty += counts.OD;
                }
            }

            const res = {
                week: b.week,
                present,
                absent,
                leave,
                dutyRest,
                onDuty,
            };
            if (b.date) res.date = b.date;
            if (b.from && b.to && b.from !== b.to) {
                res.from = b.from;
                res.to = b.to;
            }
            return res;
        });
    }

    const totalP = series.reduce((acc, s) => acc + s.present, 0);
    const totalA = series.reduce((acc, s) => acc + s.absent, 0);
    const totalL = series.reduce((acc, s) => acc + s.leave, 0);
    const totalDR = series.reduce((acc, s) => acc + s.dutyRest, 0);
    const totalOD = series.reduce((acc, s) => acc + s.onDuty, 0);
    const totalWorking = totalP + totalA + totalL + totalDR + totalOD;
    const n = series.length || 1;

    const summary = {
        totalEmployees,
        avgPresent: Math.round(totalP / n),
        avgAbsent: Math.round(totalA / n),
        avgLeave: Math.round(totalL / n),
        avgDutyRest: Math.round(totalDR / n),
        avgAttendance: totalWorking > 0 ? Math.round(((totalP + totalDR + totalOD) / totalWorking) * 100) : 0,
    };

    return {
        period,
        outletId,
        series,
        summary,
    };
};


const getDetailsTable = async (params = {}, user = {}) => {
    const from = params.from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = params.to || new Date().toISOString().split('T')[0];
    const search = (params.search || params.query || '').trim().toLowerCase();

    const outletId =
        user?.outlet?.id ||
        user?.outletId ||
        (typeof user?.outlet === 'number' || (typeof user?.outlet === 'string' && !isNaN(user.outlet)) ? user.outlet : null) ||
        params.outletId;

    let employeeList = [];
    if (Employee) {
        try {
            const whereClause = { status: 1 };
            if (outletId) {
                whereClause.outletId = String(outletId);
            }

            const emps = await Employee.findAll({
                where: whereClause,
                include: EmployeeRole ? [{ model: EmployeeRole, as: 'employeerole' }] : [],
                order: [['employeeName', 'ASC']],
            });

            if (emps && emps.length > 0) {
                employeeList = emps.map((e) => ({
                    id: e.employeeCode || `EMP${e.id}`,
                    employeeId: e.employeeCode || `EMP${e.id}`,
                    name: e.employeeName,
                    role: e.employeerole?.employeeRole || 'Technician',
                    outletId: e.outletId,
                    initials: getInitials(e.employeeName),
                }));
            }
        } catch (e) {
            logger.warn('Error fetching employees in getDetailsTable:', e.message);
        }
    }


    const empIds = employeeList.map((e) => e.id);
    const attendanceWhere = {
        date: { [Op.between]: [from, to] },
    };
    if (outletId) {
        attendanceWhere[Op.or] = [
            { outletId: String(outletId) },
            { employeeId: { [Op.in]: empIds.length > 0 ? empIds : [''] } }
        ];
    } else if (empIds.length > 0) {
        attendanceWhere.employeeId = { [Op.in]: empIds };
    }

    const records = await Attendance.findAll({
        where: attendanceWhere,
    });

    const empRecordsMap = new Map();
    records.forEach((r) => {
        if (!empRecordsMap.has(r.employeeId)) {
            empRecordsMap.set(r.employeeId, []);
        }
        empRecordsMap.get(r.employeeId).push(r);
    });

    const details = employeeList.map((emp) => {
        const list = empRecordsMap.get(emp.id) || [];
        const present = list.filter((r) => r.status === 'P').length;
        const absent = list.filter((r) => r.status === 'A').length;
        const leave = list.filter((r) => r.status === 'L').length;
        const dutyRest = list.filter((r) => r.status === 'DR').length;
        const onDuty = list.filter((r) => r.status === 'OD').length;

        const workingDays = present + absent + leave + dutyRest + onDuty;
        const eligible = present + onDuty + dutyRest;
        const pct = workingDays > 0 ? Math.round((eligible / workingDays) * 100) : 0;
        const progress = eligible;

        return {
            id: emp.id,
            employeeId: emp.employeeId,
            name: emp.name,
            role: emp.role,
            outletId: emp.outletId || outletId || null,
            initials: emp.initials || getInitials(emp.name),
            present,
            absent,
            leave,
            dutyRest,
            onDuty,
            workingDays,
            pct,
            progress,
        };
    });

    let filtered = details;
    if (search) {
        filtered = details.filter(
            (d) =>
                d.name.toLowerCase().includes(search) ||
                d.id.toLowerCase().includes(search) ||
                (d.role && d.role.toLowerCase().includes(search))
        );
    }

    return {
        range: { from, to },
        outletId,
        total: filtered.length,
        data: filtered,
    };
};

const AttendanceDAO = {
    getEmployeesUnderManager,
    createRegularisation,
    getTodayMarkList,
    saveMarksBulk,
    getAnalytics,
    getDetailsTable,
};

export default AttendanceDAO;


import ExcelJS from 'exceljs';
import AttendanceService from './service.js';
import logger from '../../config/logger.js';



const submitRegularisation = async (req, res, next) => {
  try {
    let attachmentUrl = req.body.attachmentUrl || null;
    if (req.file) {
      attachmentUrl = `/uploads/attendance/${req.file.filename}`;
    }
    const payload = {
      ...req.body,
      attachmentUrl: attachmentUrl || req.body.attachmentUrl || null,
    };
    const data = await AttendanceService.createRegularisation(payload, req.user || {});
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Regularisation submitted successfully and applied to attendance',
      data,
    });
  } catch (err) {
    logger.error('Attendance Controller submitRegularisation error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};


const getTodayMarkList = async (req, res, next) => {
  try {
    const data = await AttendanceService.getTodayMarkList(req.query, req.user || {});
    const outletId =
      req.user?.outlet?.id ||
      req.user?.outletId ||
      (typeof req.user?.outlet === 'number' || (typeof req.user?.outlet === 'string' && !isNaN(req.user.outlet)) ? req.user.outlet : null) ||
      req.query.outletId ||
      null;

    return res.status(200).json({
      requestSuccessful: true,
      date: req.query.date || new Date().toISOString().split('T')[0],
      outletId,
      data,
    });
  } catch (err) {
    logger.error('Attendance Controller getTodayMarkList error:', err);
    next(err);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const data = await AttendanceService.getEmployeesUnderManager(req.query, req.user || {});
    return res.status(200).json({
      requestSuccessful: true,
      data,
    });
  } catch (err) {
    logger.error('Attendance Controller getEmployees error:', err);
    next(err);
  }
};

const saveMarksBulk = async (req, res, next) => {
  try {
    const result = await AttendanceService.saveMarksBulk(req.body, req.user || {});
    return res.status(200).json({
      requestSuccessful: true,
      message: `Attendance marked successfully for ${result.count} records.`,
      ...result,
    });
  } catch (err) {
    logger.error('Attendance Controller saveMarksBulk error:', err);
    if (err.status) {
      return res.status(err.status).json({
        requestSuccessful: false,
        message: err.message,
      });
    }
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await AttendanceService.getAnalytics(req.query, req.user || {});
    return res.status(200).json({
      requestSuccessful: true,
      ...data,
    });
  } catch (err) {
    logger.error('Attendance Controller getAnalytics error:', err);
    next(err);
  }
};

const getDetailsTable = async (req, res, next) => {
  try {
    const data = await AttendanceService.getDetailsTable(req.query, req.user || {});
    return res.status(200).json({
      requestSuccessful: true,
      ...data,
    });
  } catch (err) {
    logger.error('Attendance Controller getDetailsTable error:', err);
    next(err);
  }
};

const exportAnalytics = async (req, res, next) => {
  try {
    const { period = '7D', from, to } = req.query;
    const result = await AttendanceService.getAnalytics(req.query, req.user || {});
    const { series = [], summary = {} } = result;

    const label = from && to ? `${from}_to_${to}` : (period || 'Analytics');
    const filename = `Attendance_Analytics_${label}.xlsx`;

    // Generate Excel (.xlsx) file via ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = req.user?.employeeName || req.user?.name || 'MyTVS DMS';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Attendance Analytics', {
      views: [{ showGridLines: true }],
    });

    // Title banner
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ATTENDANCE ANALYTICS REPORT';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep Navy
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 32;

    // Subtitle / metadata
    worksheet.mergeCells('A2:H2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Period: ${from && to ? `${from} to ${to}` : period}   |   Total Employees: ${summary.totalEmployees ?? '—'}   |   Overall Attendance: ${summary.avgAttendance ?? 0}%   |   Generated: ${new Date().toLocaleDateString('en-IN')}`;
    periodCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    periodCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    worksheet.getRow(2).height = 20;

    worksheet.getRow(3).height = 10;

    // Summary Metric Cards Block (Row 4 & 5)
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Total Employees';
    worksheet.mergeCells('A5:B5');
    worksheet.getCell('A5').value = summary.totalEmployees ?? 0;

    worksheet.mergeCells('C4:C4');
    worksheet.getCell('C4').value = 'Avg Present';
    worksheet.getCell('C5').value = summary.avgPresent ?? 0;

    worksheet.mergeCells('D4:D4');
    worksheet.getCell('D4').value = 'Avg Absent';
    worksheet.getCell('D5').value = summary.avgAbsent ?? 0;

    worksheet.mergeCells('E4:E4');
    worksheet.getCell('E4').value = 'Avg Leave';
    worksheet.getCell('E5').value = summary.avgLeave ?? 0;

    worksheet.mergeCells('F4:F4');
    worksheet.getCell('F4').value = 'Avg Duty Rest';
    worksheet.getCell('F5').value = summary.avgDutyRest ?? 0;

    worksheet.mergeCells('G4:H4');
    worksheet.getCell('G4').value = 'Overall Attendance';
    worksheet.mergeCells('G5:H5');
    worksheet.getCell('G5').value = `${summary.avgAttendance ?? 0}%`;

    const metricHeaders = ['A4', 'C4', 'D4', 'E4', 'F4', 'G4'];
    metricHeaders.forEach((ref) => {
      const c = worksheet.getCell(ref);
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF64748B' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    const metricValues = ['A5', 'C5', 'D5', 'E5', 'F5', 'G5'];
    metricValues.forEach((ref) => {
      const c = worksheet.getCell(ref);
      c.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
    });
    worksheet.getRow(4).height = 18;
    worksheet.getRow(5).height = 24;

    worksheet.getRow(6).height = 12;

    // Table Column Widths
    worksheet.columns = [
      { key: 'week', width: 22 },
      { key: 'present', width: 14 },
      { key: 'absent', width: 14 },
      { key: 'leave', width: 14 },
      { key: 'dutyRest', width: 15 },
      { key: 'onDuty', width: 14 },
      { key: 'total', width: 16 },
      { key: 'rate', width: 16 },
    ];

    const tableHeaders = [
      'Timeline / Period',
      'Present (P)',
      'Absent (A)',
      'Leave (L)',
      'Duty Rest (DR)',
      'On Duty (OD)',
      'Total Tracked',
      'Attendance %',
    ];

    const headerRow = worksheet.getRow(7);
    headerRow.values = tableHeaders;
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF64748B' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    let sumPresent = 0;
    let sumAbsent = 0;
    let sumLeave = 0;
    let sumDutyRest = 0;
    let sumOnDuty = 0;
    let sumTotal = 0;

    series.forEach((s, idx) => {
      const p = s.present || 0;
      const a = s.absent || 0;
      const l = s.leave || 0;
      const dr = s.dutyRest || 0;
      const od = s.onDuty || 0;
      const total = p + a + l + dr + od;
      const rate = total > 0 ? Math.round(((p + dr + od) / total) * 100) : 0;

      sumPresent += p;
      sumAbsent += a;
      sumLeave += l;
      sumDutyRest += dr;
      sumOnDuty += od;
      sumTotal += total;

      const row = worksheet.addRow([
        s.week || '',
        p,
        a,
        l,
        dr,
        od,
        total,
        `${rate}%`,
      ]);
      row.height = 22;

      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (colNumber === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // Summary Total Row
    const overallRate = sumTotal > 0 ? Math.round(((sumPresent + sumDutyRest + sumOnDuty) / sumTotal) * 100) : 0;
    const summaryRow = worksheet.addRow([
      'TOTAL / OVERALL',
      sumPresent,
      sumAbsent,
      sumLeave,
      sumDutyRest,
      sumOnDuty,
      sumTotal,
      `${overallRate}%`,
    ]);
    summaryRow.height = 24;
    summaryRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF64748B' } },
        bottom: { style: 'medium', color: { argb: 'FF64748B' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      if (colNumber === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Attendance Controller exportAnalytics error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        requestSuccessful: false,
        message: 'Failed to export attendance analytics',
        error: err.message,
      });
    }
    next(err);
  }
};

const exportDetails = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const result = await AttendanceService.getDetailsTable(req.query, req.user || {});
    const data = Array.isArray(result?.data) ? result.data : [];
    const range = result?.range || { from: from || 'Start', to: to || 'End' };

    const filename = `Attendance_Details_${range.from}_to_${range.to}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = req.user?.employeeName || req.user?.name || 'MyTVS DMS';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Attendance Details', {
      views: [{ showGridLines: true }],
    });

    // 1. Title banner
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'EMPLOYEE ATTENDANCE DETAILS REPORT';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, 
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 32;

    // 2. Subtitle / metadata
    worksheet.mergeCells('A2:J2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Date Range: ${range.from} to ${range.to}   |   Total Employees: ${data.length}   |   Outlet: ${result?.outletId || req.user?.outletId || 'All'}   |   Generated: ${new Date().toLocaleDateString('en-IN')}`;
    periodCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    periodCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    worksheet.getRow(2).height = 20;

    worksheet.getRow(3).height = 10;

    // 3. Summary Metric Cards Block (Row 4 & 5)
    const totals = data.reduce(
      (acc, r) => ({
        present: acc.present + (r.present || 0),
        absent: acc.absent + (r.absent || 0),
        leave: acc.leave + (r.leave || 0),
        dutyRest: acc.dutyRest + (r.dutyRest || 0),
        onDuty: acc.onDuty + (r.onDuty || 0),
      }),
      { present: 0, absent: 0, leave: 0, dutyRest: 0, onDuty: 0 }
    );
    const avgPct = data.length > 0
      ? Math.round(data.reduce((acc, r) => acc + (r.pct || 0), 0) / data.length)
      : 0;

    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Total Employees';
    worksheet.mergeCells('A5:B5');
    worksheet.getCell('A5').value = data.length;

    worksheet.getCell('C4').value = 'Total Present';
    worksheet.getCell('C5').value = totals.present;

    worksheet.getCell('D4').value = 'Total Absent';
    worksheet.getCell('D5').value = totals.absent;

    worksheet.getCell('E4').value = 'Total Leave';
    worksheet.getCell('E5').value = totals.leave;

    worksheet.getCell('F4').value = 'Total Duty Rest';
    worksheet.getCell('F5').value = totals.dutyRest;

    worksheet.getCell('G4').value = 'Total On Duty';
    worksheet.getCell('G5').value = totals.onDuty;

    worksheet.mergeCells('H4:J4');
    worksheet.getCell('H4').value = 'Avg Attendance %';
    worksheet.mergeCells('H5:J5');
    worksheet.getCell('H5').value = `${avgPct}%`;

    const metricHeaders = ['A4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4'];
    metricHeaders.forEach((ref) => {
      const c = worksheet.getCell(ref);
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF64748B' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });

    const metricValues = ['A5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5'];
    metricValues.forEach((ref) => {
      const c = worksheet.getCell(ref);
      c.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = { bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } } };
    });
    worksheet.getRow(4).height = 18;
    worksheet.getRow(5).height = 24;

    worksheet.getRow(6).height = 12;

    // 4. Columns & Headers
    worksheet.columns = [
      { key: 'empId', width: 16 },
      { key: 'name', width: 26 },
      { key: 'role', width: 20 },
      { key: 'present', width: 14 },
      { key: 'absent', width: 14 },
      { key: 'leave', width: 14 },
      { key: 'dutyRest', width: 15 },
      { key: 'onDuty', width: 14 },
      { key: 'pct', width: 16 },
      { key: 'progress', width: 16 },
    ];

    const tableHeaders = [
      'Employee ID',
      'Employee Name',
      'Role',
      'Present (P)',
      'Absent (A)',
      'Leave (L)',
      'Duty Rest (DR)',
      'On Duty (OD)',
      'Attendance %',
      'Progress (Days)',
    ];

    const headerRow = worksheet.getRow(7);
    headerRow.values = tableHeaders;
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF64748B' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // 5. Data Rows
    data.forEach((r, idx) => {
      const row = worksheet.addRow([
        r.id || r.employeeId || '',
        r.name || '',
        r.role || 'Technician',
        r.present || 0,
        r.absent || 0,
        r.leave || 0,
        r.dutyRest || 0,
        r.onDuty || 0,
        `${r.pct || 0}%`,
        r.progress || 0,
      ]);
      row.height = 22;

      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 6. Summary Total Row
    const summaryRow = worksheet.addRow([
      'TOTAL / AVERAGE',
      `Total Employees: ${data.length}`,
      '—',
      totals.present,
      totals.absent,
      totals.leave,
      totals.dutyRest,
      totals.onDuty,
      `${avgPct}%`,
      '—',
    ]);
    summaryRow.height = 24;
    summaryRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF64748B' } },
        bottom: { style: 'medium', color: { argb: 'FF64748B' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      if (colNumber <= 3) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Attendance Controller exportDetails error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        requestSuccessful: false,
        message: 'Failed to export attendance details',
        error: err.message,
      });
    }
    next(err);
  }
};

const AttendanceController = {
  submitRegularisation,
  getTodayMarkList,
  getEmployees,
  saveMarksBulk,
  getAnalytics,
  getDetailsTable,
  exportAnalytics,
  exportDetails,
};

export default AttendanceController;

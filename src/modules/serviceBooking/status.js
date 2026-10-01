const namedStatuses = {
  confirmed: { status: 'Confirmed', statusFlag: 1 },
  pending: { status: 'Pending', statusFlag: 1 },
  cancelled: { status: 'Cancelled', statusFlag: 4 },
  completed: { status: 'Completed', statusFlag: 3 },
  'move to estimate': { status: 'Move to Estimate', statusFlag: 2 },
  open: { status: 'Open', statusFlag: 1 },
  inprogress: { status: 'Inprogress', statusFlag: 2 },
};

const numericStatuses = {
  1: { status: 'Open', statusFlag: 1 },
  2: { status: 'Inprogress', statusFlag: 2 },
  3: { status: 'Completed', statusFlag: 3 },
  4: { status: 'Cancelled', statusFlag: 4 },
};

export const SERVICE_BOOKING_ACTIVITY_STATUSES = [
  'Appointment Rescheduled',
  'Not Contactable',
  'Call Back/Under Follow Up',
  'Hung Up/Refuse to Speak',
  'Service Done from Outside',
  'Service Not required',
  'Vehicle Sold',
  'Wrong Number',
  'Appointment Cancelled',
  'Proceed to Jobcard',
  'Others',
];

export const normalizeServiceBookingActivityStatus = (value) => {
  if (typeof value !== 'string') return null;
  return SERVICE_BOOKING_ACTIVITY_STATUSES.find(
    status => status.toLowerCase() === value.trim().toLowerCase()
  ) || null;
};

export const normalizeServiceBookingStatus = (value) => {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (namedStatuses[normalized]) return namedStatuses[normalized];
  }

  return numericStatuses[Number(value)] || null;
};

export const isValidServiceBookingStatus = (value) =>
  normalizeServiceBookingStatus(value) !== null;

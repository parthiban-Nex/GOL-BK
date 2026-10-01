import db from '../index.js';

const Outlet = db.outlets;

const findOutletByBranchOrCode = async (branchValue) => {
  if (!branchValue) {
    return null;
  }

  const outletByCode = await Outlet.findOne({ where: { outletCode: branchValue } });
  if (outletByCode) {
    return outletByCode;
  }

  // return Outlet.findOne({ where: { branch: branchValue } });
  return null;
};

const updateOutletOracleDetails = async (id, data) => {
  return Outlet.update(data, { where: { id } });
};

export default {
  findOutletByBranchOrCode,
  updateOutletOracleDetails,
};

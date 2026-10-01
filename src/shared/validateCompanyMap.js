import db from '../modules/index.js';
import Op from 'sequelize';

const Company = db.companies;
const ItemGroup = db.itemgroups;
const Outlet = db.outlets;
const Role = db.role;

const findByCompanyId = async (companyId) => {
  console.log(companyId + '  ---------companyId ');
  let company = await Company.findAll({ where: { id: companyId } });
  return company;
};
// { where: { id: {[Op.or]: companyId} } previous where condition

const findByItemGroupId = async (itemGroupId) => {
  console.log(itemGroupId + '  ---------item group');
  let itemGroup = await ItemGroup.findAll({ where: { id: itemGroupId } });
  return itemGroup;
};

const findByOutletId = async (outletId) => {
  let outlet = await Outlet.findAll({ where: { id: { [Op.or]: outletId } } });
  return outlet;
};

const findByRoleId = async (roleId) => {
  let role = await Role.findAll({ where: { id: { [Op.or]: roleId } } });
  return role;
};

const validateCompanyMap = {
  findByCompanyId,
  findByItemGroupId,
  findByOutletId,
  findByRoleId,
};
export default validateCompanyMap;

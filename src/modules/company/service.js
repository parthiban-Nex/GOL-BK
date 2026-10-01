import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';

const Company = db.companies;

const addCompany = async (company, userId) => {
  return await Company.create({
    code: company.code,
    name: company.name,
    image: company.image,
    status: company.status,
    createdBy: userId,
  });
};

const findByCode = async (code) => {
  return await Company.findOne({ where: { code: code } });
};

const findByName = async (name) => {
  return await Company.findOne({ where: { name: name } });
};

const findById = async (id) => {
  return await Company.findOne({ where: { id: id } });
};

const getAllCompany = async () => {
  const data = await Company.findAll({
    attributes: ['id', 'code', 'name', 'image', 'status'],
  });
  return data;
};

const getCompany = async (id) => {
  const company = await Company.findOne({ where: { id: id } });
  if (!company) {
    throw new notFoundException();
  }
  return company;
};

const updateCompany = async (id, code, name, image, status, userId) => {
  return await Company.update(
    {
      code: code,
      name: name,
      image: image,
      status: status,
      updatedBy: userId,
    },
    { where: { id: id } }
  );
};

const deleteCompany = async (id) => {
  const data = await Company.destroy({ where: { id: id } });
  return data;
};

const CompanyService = {
  addCompany,
  findByCode,
  findByName,
  getAllCompany,
  getCompany,
  updateCompany,
  deleteCompany,
  findById,
};

export default CompanyService;

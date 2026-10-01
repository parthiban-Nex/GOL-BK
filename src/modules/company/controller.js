import CompanyService from './service.js';

const addCompany = async (req, res, next) => {
  try {
    const company = await CompanyService.addCompany(req.body, req.user.id);
    return res.send({
      requestSuccessful: true,
      message: 'Data Saved successfully',
    });
  } catch (err) {
    logger.error('Company Controller addCompany Error:', err);
    next(err);
  }
};

const getAllCompany = async (req, res, next) => {
  try {
    const data = await CompanyService.getAllCompany();
    res.status(200).send({
      requestSuccessful: true,
      companyData: data,
    });
  } catch (err) {
    logger.error('Company Controller getAllCompany Error:', err);
    next(err);
  }
};

const getOneCompany = async (req, res, next) => {
  try {
    const company = await CompanyService.getCompany(req.params.id);
    res.status(200).send({
      requestSuccessful: true,
      data: company,
    });
  } catch (err) {
    logger.error('Company Controller getOneCompany Error:', err);
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const id = req.params.id;
    let { code, name, image, status } = req.body;
    let userId = req.user.id;

    const company = await CompanyService.getCompany(id);

    if (company) {
      let data = await CompanyService.updateCompany(
        id,
        code,
        name,
        image,
        status,
        userId
      );
      res.status(200).send({
        requestSuccessful: true,
        message: 'Data updated successfully',
      });
    }
  } catch (err) {
    logger.error('Company Controller updateCompany Error:', err);
    next(err);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const id = req.params.id;

    const company = await CompanyService.getCompany(id);

    if (company) {
      let data = await CompanyService.deleteCompany(id);
      res.status(200).send({
        message: 'success',
        data: data,
      });
    }
  } catch (err) {
    logger.error('Company Controller deleteCompany Error:', err);
    next(err);
  }
};

const controller = {
  addCompany,
  getAllCompany,
  getOneCompany,
  updateCompany,
  deleteCompany,
};

export default controller;

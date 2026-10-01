import db from '../index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const Psfreview=db.psfreviews
const customerfeedback=db.customerfeedback
const PsfReviewLog=db.psfreviewlogs
const disposition=db.dispositions
const subdisposition=db.subdispositions
const customerComplaintSource=db.customercomplaintsource
const customerComplaint=db.customercomplaint
const CreatePsfReview = async (body, user) => {
  
  body.createdBy = user.id;
  // body.outlet_id = user.outlet.id;
 
  let data = [];
  try {
      let ispsfreviewexist=await Psfreview.findOne({where:{transaction_id:body.transaction_id}})
      if(!ispsfreviewexist){
    data = await Psfreview.create(body);
      }
      else{
      await ispsfreviewexist.update(
      {status:body.status}
         );
       data=ispsfreviewexist

      }
    
  } catch (err) {
    logger.error('CreatePsfReview  error', err);
  }

  return data;
};


const CreatePsfReviewLog = async (body, user,psfreview) => {
  const {status,...remdata}=body
  let reqdata={...remdata,
    createdBy : user.id,
    psf_review_id:psfreview['dataValues']['id']
  }
 
  let data = [];
  try {
    data = await PsfReviewLog.create(reqdata);
  } catch (err) {
    logger.error('New Psf Review log error', err);
  }

  return data;
};

const CreateCustomerFeedback = async (body, psfreview,psfreviewlog) => {
  console.log(psfreview.dataValues, 'psfreview');

  let data = [];
  try {
    const psf_review_id=psfreview['dataValues']['id']
    const psf_review_log_id=psfreviewlog['dataValues']['id']

  for(let item of body){
  let currentdata= await customerfeedback.create({...item,
    psf_review_id: psf_review_id,
    psf_review_log_id:psf_review_log_id
   })
  
   data.push(currentdata.dataValues)
  };
    
  } catch (err) {
    logger.error('New Customer FeedBack error', err);
  }

  return data;
};

const GetPsfReviewLog = async (body, user) => {
  let data = [];
  try {
    const query = `
      SELECT 
        prl.*,
        d.title AS dispositionTitle,
        sd.subDisPositionTitle,
        Round(Avg(cf.ratings),1) as rating
      FROM psf_reviews pr
      LEFT JOIN psf_review_logs prl ON pr.id = prl.psf_review_id
      LEFT JOIN dispositions d ON prl.psf_disposition = d.id
      LEFT JOIN subdispositions sd ON prl.psf_sub_disposition = sd.id
      LEFT JOIN customer_feedbacks cf ON prl.id = cf.psf_review_log_id
      WHERE pr.transaction_id = :transactionId
      GROUP BY prl.id, d.title, sd.subDisPositionTitle

    `;

    data = await db.sequelize.query(query, {
      replacements: { transactionId: body.id },
      type: db.sequelize.QueryTypes.SELECT
    });
  } catch (err) {
    logger.error('Raw PsfReview error', err);
  }
  return data
}

const getPsfReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;

    let query = `
      SELECT 
        prl.*,
        d.title AS dispositionTitle,
        sd.subDisPositionTitle,
        JSON_ARRAYAGG(
    JSON_OBJECT(
      'question', fd.question,
      'rating', cf.ratings
    )
  ) AS feedbacks,
        transactions.reg_no,
        models.modelName AS Model,makes.makeName as Make,
        transactions.job_card_no AS Doc_Number,transactions.createdAt as job_card_date,
        billings.createdAt AS Doc_Date,billings.delivery_date,billings.bill_no,
        transactions.customer_mobileNumber AS Cus_mobile,transactions.customer_code,
        transactions.customer_name,employees.employeeName as sa_name,sources.sourceName,
        sourcetypes.sourceTypeName,transactions.outlet_code,
        pr.status AS psf_status
      FROM billings
      LEFT JOIN transactions ON billings.transaction_id = transactions.id
      LEFT JOIN users ON transactions.created_by = users.id
      LEFT JOIN employees ON users.employeeId = employees.id
      LEFT JOIN sources ON transactions.source = sources.id
      LEFT JOIN sourcetypes ON transactions.source_type = sourcetypes.id
      LEFT JOIN vehicles ON transactions.vehicle_id = vehicles.id
      LEFT JOIN makes ON vehicles.makeId = makes.id
      LEFT JOIN models ON vehicles.modelId = models.id
      LEFT JOIN psf_reviews pr ON pr.transaction_id = transactions.id
      LEFT JOIN (
        SELECT *
        FROM psf_review_logs prl1
        WHERE prl1.id = (
          SELECT MAX(prl2.id)
          FROM psf_review_logs prl2
          WHERE prl2.psf_review_id = prl1.psf_review_id
        )
      ) prl ON pr.id = prl.psf_review_id
      LEFT JOIN dispositions d ON prl.psf_disposition = d.id
      LEFT JOIN subdispositions sd ON prl.psf_sub_disposition = sd.id
      LEFT JOIN customer_feedbacks cf ON prl.id = cf.psf_review_log_id
      LEFT JOIN feedback_questions fd ON cf.question_id = fd.id
    `;

    // Employee outlet filter
        const conditions = [];

    if(user.reportAccess === 1){
    const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { employeeId: user.employeeId },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const outletIds = outletResult.map(row => row.outlet_id);

    // WHERE clause
    if (outletIds.length > 0) {
      conditions.push(`billings.outlet_id IN ${db.sequelize.escape(outletIds)}`);
    }
    else{
      return []
    }
  }
    else{
      conditions.push(`billings.outlet_id = ${user.outlet.id}`);
      }
    if (fromDate && toDate) {
      conditions.push(`billings.delivery_date BETWEEN :fromDate AND :toDate`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    // ORDER BY
    query += ` GROUP BY 
  prl.id, 
  d.title, 
  sd.subDisPositionTitle,
  transactions.id,
  transactions.reg_no,
  models.modelName,
  transactions.job_card_no,
  billings.createdAt,
  transactions.customer_mobileNumber,
  transactions.createdAt,
  billings.delivery_date,
  billings.bill_no,
  transactions.customer_code,
  transactions.customer_name,
  makes.makeName,
  employees.employeeName,
  sources.sourceName,
  sourcetypes.sourceTypeName,
  pr.status
  ORDER BY billings.delivery_date DESC`;

    const result = await db.sequelize.query(query, {
      replacements: {
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return result || [];

  } catch (err) {
    logger.error('Item Search fetching error', err);
    return [];
  }
};

const GetCustomerComplaintSource = async (user) => {
  let data = [];
  try {
    data= await customerComplaintSource.findAll({
      where: {
        status: 1
      },
      order: [['title', 'ASC']]
    });
  } catch (err) {
    logger.error('Customer Complaint Source Fetch error', err);
  }
  return data
}
const generateComplaintNo = async (documentType, outletCode, outletId) => {
  const prefix = documentType.split('(')[0].trim();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const financialYear = month >= 3 ? `${year + 1}`.slice(2) : `${year}`.slice(2);
  const sequenceKey = `${prefix}-${outletCode}${financialYear}`;


  try {
    let newNumber = 1;

   
      const lastComplaint = await customerComplaint.findOne({
        where: {
          complaint_no: { [Op.like]: `${sequenceKey}-%` },
          branch_id: outletId,
        },
        order: [['id', 'DESC']],
      });

      if (lastComplaint?.complaint_no) {
        const parts = lastComplaint.complaint_no.split("-");
        const lastNum = parseInt(parts[2]);
        newNumber = lastNum + 1;
      }
    

    return `${sequenceKey}-${String(newNumber).padStart(6, '0')}`;
  }
  catch(err){
    console.error(err)
  }
};
const CreateCustomerComplaint = async (body, user) => {
  const complaint_no=await generateComplaintNo(body.job_type,body.Outlet,body.branch_id)
  let reqdata={...body,
    createdBy : user.id,
    complaint_no:complaint_no
  }
 
  let data = [];
  try {
    data = await customerComplaint.create(reqdata);
  } catch (err) {
    logger.error('New customer complaint error', err);
  }

  return data;
};
const getCustomerComplaint = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { complaint_no: { [Op.like]: `%${searchKey}%` } },
          { vehicle_reg_no: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      let userCondition={}
     
if(user.reportAccess === 1){     
const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { employeeId: user.employeeId },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const outletIds = outletResult.map(row => row.outlet_id);

    if(outletIds.length===0){
       userCondition = {branch_id: {[Op.in]: outletIds}};
    }
    else{
      return []
    }
    
  }
  else{
    userCondition = {branch_id: user.outlet.id};
  }
      const complaints = await customerComplaint.findAll({
        where: { ...searchCondition, ...userCondition },
        
          attributes: [
              'id',
              'complaint_no',
              ['createdAt', 'complaint_date'],
              'customer_name',
              'customer_mobile',
              "vehicle_reg_no",
              "disposition_name",
              "status"
          ],
          
          order: [[db.Sequelize.col('createdAt'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
let count=await customerComplaint.count({where:userCondition})
    return {complaints,count};
  } catch (err) {
    logger.error(' customer complaint fetching error', err);
  }
};
const getClosedCustomerComplaint = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { complaint_no: { [Op.like]: `%${searchKey}%` } },
          { vehicle_reg_no: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      let userCondition={}
if(user.reportAccess === 1){     
const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { employeeId: user.employeeId },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const outletIds = outletResult.map(row => row.outlet_id);

  if(outletIds.length===0){
       userCondition = {branch_id: {[Op.in]: outletIds}};
  }
  else{      
    return []
    }
  
  }
  else{
    userCondition = {branch_id: user.outlet.id};
  }
      const complaints = await customerComplaint.findAll({
        where: { ...searchCondition, ...userCondition,status:3 },
        
          attributes: [
              'id',
              'complaint_no',
              ['createdAt', 'complaint_date'],
              'customer_name',
              'customer_mobile',
              "vehicle_reg_no",
              "disposition_name",
              "status",
              "complaint_against_job_card_id",
              "reason",
              "phone_call_notes",
             
          ],
          include: [
                {
                  model: customerComplaintSource,
                  as: 'ccsource',
                  attributes: ['id', 'title']
                }
              ],
          
          order: [[db.Sequelize.col('complaint_date'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
let count=await customerComplaint.count({where:userCondition,status:3})
    return {complaints,count};
  } catch (err) {
    logger.error(' customer complaint fetching error', err);
  }
};

const getComplaintReport = async (reqData, user) => {
  try {
    const { fromDate, toDate } = reqData;

    let query = `
      SELECT 
        outlets.outletCode,cc.complaint_no,cc.createdAt,cc.complaint_against_job_card_no,cc.vehicle_reg_no,
        cc.make,cc.model,cc.customer_name,cc.customer_mobile,cc.status,cc.disposition_name,cc.reason,
        cc.next_follow_up,cc.complaint_rescheduled_date,cc.phone_call_notes,
        customer_complaint_sources.title as complaint_source
      FROM customer_complaints cc 
      INNER JOIN outlets ON cc.branch_id = outlets.id
      LEFT JOIN customer_complaint_sources ON cc.source_of_complaint = customer_complaint_sources.id
    `;

    // Employee outlet filter
    const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { employeeId: user.employeeId },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const outletIds = outletResult.map(row => row.outlet_id);

    // WHERE clause
    const conditions = [];
    if (outletIds.length > 0) {
      conditions.push(`cc.branch_id IN (:outlet_ids)`);
    }
    if (fromDate && toDate) {
      conditions.push(`cc.createdAt BETWEEN :fromDate AND :toDate`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    // ORDER BY
    query += `
  ORDER BY cc.createdAt DESC`;

    const result = await db.sequelize.query(query, {
      replacements: {
        outlet_ids: outletIds,
        fromDate: fromDate,
        toDate: `${toDate} 23:59:59`,
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    return result || [];

  } catch (err) {
    logger.error('customer compliant report fetching error', err);
    return [];
  }
};
const UpdateCustomerComplaint = async (body, user) => {
 const { id, ...updateData } = body;
 
  let data = [];
  try {
    data = await customerComplaint.update(updateData, {
      where: { id },
      returning: true
    });

  } catch (err) {
    logger.error('New customer complaint error', err);
  }

  return data;
};

const getCustomerComplaintForSa = async (reqData,user) => {
  try {
      // Fetch GRN details with grand total from related GrnParts
      const { searchKey, offset, limit } = reqData;
      const searchCondition = searchKey ? {
        [Op.or]: [
          { complaint_no: { [Op.like]: `%${searchKey}%` } },
          { vehicle_reg_no: { [Op.like]: `%${searchKey}%` } },
        ]
      } : {};
      let userCondition={}
if(user.reportAccess === 1){     
const outletQuery = `SELECT outlet_id FROM employee_outlet_map WHERE emp_id = :employeeId`;
    const outletResult = await db.sequelize.query(outletQuery, {
      replacements: { employeeId: user.employeeId },
      type: db.Sequelize.QueryTypes.SELECT,
    });
    const outletIds = outletResult.map(row => row.outlet_id);

  if(outletIds.length===0){
       userCondition = {branch_id: {[Op.in]: outletIds}};
  }
  else{      
    return []
    }
  
  }
  else{
    userCondition = {branch_id: user.outlet.id};
  }
      const complaints = await customerComplaint.findAll({
        where: { ...searchCondition, ...userCondition,status:{[Op.in]:[1,2]} },
        
          attributes: [
              'id',
              'complaint_no',
              ['createdAt', 'complaint_date'],
              'customer_name',
              'customer_mobile',
              "vehicle_reg_no",
              "make",
              "model",
              "status",
              "next_follow_up",
              "disposition_name",
              // "complaint_against_job_card_id",
              "reason",
              "agent_name",
              "complaint_against_job_card_no"
              // "phone_call_notes",
             
          ],
          include: [
                {
                  model: customerComplaintSource,
                  as: 'ccsource',
                  attributes: ['id', 'title']
                }
              ],
          
          order: [[db.Sequelize.col('complaint_date'), 'DESC']], // Correct order clause
          limit,
        offset,

      // Group by the GRN to calculate sum correctly for each GRN
    });
let count=await customerComplaint.count({where:userCondition})
    return {complaints,count};
  } catch (err) {
    logger.error(' customer complaint fetching error', err);
  }
};

const UpdateCustomerComplaintForSa = async (body, user) => {
  const { id, ...updateData } = body;
 console.log(updateData,'updateData')
  let data = [];
  try {
    data = await customerComplaint.update(updateData, {
      where: { id: id }
    });
  } catch (err) {
    logger.error('New customer complaint error', err);
  }

  return data;
};

const PsfReviewService={
    CreatePsfReview,CreateCustomerFeedback,CreatePsfReviewLog,GetPsfReviewLog,getPsfReport,GetCustomerComplaintSource,
    CreateCustomerComplaint,getCustomerComplaint,getClosedCustomerComplaint,getComplaintReport,UpdateCustomerComplaint,getCustomerComplaintForSa,
    UpdateCustomerComplaintForSa
}
  export default  PsfReviewService;


import db from '../../index.js';
import logger from '../../../config/logger.js';
import axios from 'axios';
import {EXTERNAL_API} from "../../../config/externalUrl.js"
import { Storage } from '@google-cloud/storage';
import { promisify } from 'util';
import { finished } from 'stream';
import FormData from 'form-data';
const finishedPromise = promisify(finished);

const Enquiry=db.enquiry
const EnquiryChat=db.enquiryChat
const EnquiryIndent=db.enquiryIndent
const PartIndent=db.partsIndent
const EnquiryToken=db.enquiryToken
const FindEnquiry = async (id) => {
   
  let data =null;
  try {
    data =await Enquiry.findOne({where:{transaction_id:id}});
  } catch (err) {
    logger.error('Find Enquiry error', err);
  }

  return data;
};

const CreateOrGetEnquiryToken = async (req,res,next) => {
  console.log("CreateOrGetEnquiryToken called")
  try {
    let token
    let FindToken
     FindToken=await EnquiryToken.findOne(
      {where:{outlet_id:req.user.outlet.id}}
    )
    let now = Date.now()- 5*60*1000; // 5 minutes early to avoid edge cases
    if(FindToken && FindToken.expires_at && FindToken.expires_at < now){
     let destroytoken= await EnquiryToken.destroy({where:{outlet_id:req.user.outlet.id}})
      FindToken=null
    }
    if(FindToken){
      token=FindToken.token
    }else{
       const response = await axios.post(
      `${EXTERNAL_API.ENQUIRY_BASE_URL}/auth/login`,
      {
    "username": req.user.outlet.outletCode,
    "password": "Tvs@123"
     },
      { headers: { "Content-Type": "application/json" } }
    );
    token= response?.data?.data?.token;
    let expiresIn= response?.data?.data?.expiresIn;
  const value = parseInt(expiresIn);
  let expires_at;
  if (expiresIn.endsWith('d')) expires_at = Date.now() + value * 24 * 60 * 60 * 1000;
  if (expiresIn.endsWith('h')) expires_at = Date.now() + value * 60 * 60 * 1000;
  if (expiresIn.endsWith('m')) expires_at = Date.now() + value * 60 * 1000;
  if (expiresIn.endsWith('s')) expires_at = Date.now() + value * 1000;


      const bodydata = {
    outlet_id: req.user.outlet.id,
    token: token,
    expires_at: expires_at,
    createdBy: req.user.id,
  };

  await EnquiryToken.create(bodydata);
  }
    req.enquiryToken=token
    next()
  } catch (err) {
    logger.error('New Enquiry error', err);
    next(err)
  }

};

const CreateEnquiry = async (id,body,token,user) => {
  let data
  try {
       const response = await axios.post(
      `${EXTERNAL_API.ENQUIRY_BASE_URL}/external/enquiry/create`,
      body,
      { headers: { "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`,

       } }
    );
    let enquirydata=response?.data?.data
     const bodydata = {
    transaction_id:id,
    enquiry_no:enquirydata?.enquiry_no,
    external_enquiry_id:enquirydata?.enquiry_id,
    outlet_id: user.outlet.id,
    createdBy: user.id,
  };
  data =await Enquiry.create(bodydata);
  } catch (err) {
        logger.error('New Enquiry error', err);
    throw err
  }
  return data;

};

const CreateEnquiryChat = async (req,body,token,enquirydata,user) => {
      let data={}
      var formdata= new FormData();
      formdata.append("message",body.message);
      formdata.append("enquiry_no",enquirydata?.enquiry_no);
      if(req.file){
        formdata.append("file",req.file.buffer,req.file.originalname);
      }
  try {
   
       const response = await axios.post(
      `${EXTERNAL_API.ENQUIRY_BASE_URL}/external/enquiry/chat/input`,
      formdata,
      { headers: {...formdata.getHeaders(),
                  "Authorization": `Bearer ${token}`,

       } }
    );
       console.log(response,"chat response")
     

     data=await EnquiryChat.create(
      {...body,
        enquiry_id:enquirydata?.id,
        enquiry_no:enquirydata?.enquiry_no,
        createdBy: user.id,
        file_url:response?.data?.data?.path || null
      }
    )
    return response?.data?.data
  } catch (err) {
  if (err.code === 'ECONNABORTED') {
    logger.error('External API Timeout:', err.message);
    throw new Error('External chat service is taking too long. Please try again.');
  }

  if (err.response) {
    // External API responded with error status (400, 500 etc)
    logger.error('External API Error:', err.response.data);
    throw new Error(err.response.data?.message || 'External chat service failed.');
  }

  if (err.request) {
    // No response received
    logger.error('No response from External API');
    throw new Error('External chat service is unreachable.');
  }

  logger.error('Unexpected Error:', err);
  throw new Error('Something went wrong while sending chat.');
}

};



const CreateEnquiryIndent = async (body,enquiry, user) => {
   
  const payload =body.map((item)=> ({
    ...item,
    enquiry_id:enquiry?.id,
    enquiry_no:enquiry?.enquiry_no,
    createdBy: user.id,
  }));

  let data = {};
  try {
    data = EnquiryIndent.bulkCreate(payload);
  } catch (err) {
    logger.error('New Enquiry error', err);
  }

  return data;
};

const UpdatePartIndent = async (body,enquiry) => {
  let data =[];
  try {
    for(let item of body){
    
    data =await PartIndent.update(
      {enquiry_id:enquiry?.id},
      {where:{id:item?.indent_id}}
    );
    }
  } catch (err) {
    logger.error('Update Partindent Enquiry error', err);
  }

  return data;
};

const GetEnquiryIndent = async (enquiry_no, user) => {
  try {
    let query = `
      SELECT enqind.item_code as indent_no, enqind.item_name as indent_name, enqind.quantity as indent_qty
      FROM enquiries AS enq
      INNER JOIN enquiry_indents AS enqind ON enqind.enquiry_id = enq.id
      WHERE enq.enquiry_no = :enquiry_no
    `;
    // Add the order by clause
    query += `
      ORDER BY enqind.id DESC
    `;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
       enquiry_no:enquiry_no
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return []; 
    }
    return result;
  } catch (err) {
    logger.error('Enquiry Indent fetching error', err);
  }
};

const GetApiIndent = async (token,body) => {
  let data
  try {
       const response = await axios.post(
      `${EXTERNAL_API.ENQUIRY_BASE_URL}/external/enquiry/status`,
      body,
      { headers: { "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`,

       } }
    );
     data=response?.data?.data
  } catch (err) {
    logger.error('Get Api Indent error', err);
  }
  return data;

};

const GetEnquiryChat = async (enquiry_no, user) => {
  try {
    let query = `
      SELECT enqchat.id,enqchat.message,enqchat.file_url,enqchat.isInternal,enqchat.createdAt
      FROM enquiries AS enq
      INNER JOIN enquiry_chats AS enqchat ON enqchat.enquiry_id = enq.id
      WHERE enq.enquiry_no = :enquiry_no
    `;
    // // Add the order by clause
    query += `
      ORDER BY enqchat.id ASC
    `;

    // Execute the query
    const result = await db.sequelize.query(query, {
      replacements: {
       enquiry_no:enquiry_no
      },
      type: db.Sequelize.QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return [];
    }
    return result;
  } catch (err) {
    logger.error('Enquiry Chat fetching error', err);
  }
};

const WebhookEnquiryChat = async (req, res) => {
  try {
    //  Read custom headers
    const username = req.headers["username"] || null;
    const password = req.headers["password"] || null;

    const validUsername = "tvs_parts";
    const validPassword = "Tvs@1234";

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        status: false,
        msg: "Invalid authentication",
      });
    }

    //  Read payload
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.json({
        status: false,
        msg: "Invalid or empty payload",
      });
    }

    if (!payload.enquiry_no) {
      return res.json({
        status: false,
        msg: "Missing enquiry_no",
      });
    }

    if (!payload.message) {
      return res.json({
        status: false,
        msg: "Missing message",
      });
    }

    const fileUrl = payload.file_url || null;

    //  Find open enquiry
    const enquiry = await Enquiry.findOne({
      where: {
        enquiry_no: payload.enquiry_no,
        // enquiry_status: "open",
      },
      raw: true,
    });

    if (!enquiry) {
      return res.json({
        status: false,
        msg: "Open enquiry not found",
      });
    }

    //  Save chat message
    await EnquiryChat.create({
      enquiry_no: payload.enquiry_no,
      enquiry_id: enquiry.id,
      message: payload.message,
      file_url: fileUrl,
      isInternal: false,
      createdBy: 0,
    });

    return res.json({
      status: true,
      msg: "Webhook data stored",
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      status: false,
      msg: "Failed to save webhook data",
    });
  }
}

const getEnquiry = async (reqData, user) => {
  try {
    const { searchKey, offset = 0, limit = 10 } = reqData;

    const whereConditions = [];
    const replacements = {
      outlet_id: user.outlet.id,
      limit,
      offset
    };

    // Search condition
    if (searchKey) {
      whereConditions.push(`e.enquiry_no LIKE :searchKey`);
      replacements.searchKey = `%${searchKey}%`;
    }

    const whereClause = `
      WHERE jc.outlet_id = :outlet_id
      ${whereConditions.length ? `AND (${whereConditions.join(" OR ")})` : ""}
    `;

    /** 🔹 Main Data Query */
    const enquiryDetails = await db.sequelize.query(
      `
      SELECT
        jc.document_type as doc_type,
        jc.reg_no as reg_no,
        jc.job_card_no as jc_no,
        jc.outlet_code,

        e.enquiry_no, e.id as enquiry_id,
        e.createdAt as enquirydate,

        mk.makeName AS make_name,
        md.modelName AS model_name

      FROM transactions jc
      INNER JOIN enquiries e ON e.transaction_id = jc.id
      LEFT JOIN vehicles v ON v.id = jc.vehicle_id
      LEFT JOIN makes mk ON mk.id = v.makeId
      LEFT JOIN models md ON md.id = v.modelId

      ${whereClause}

      ORDER BY e.createdAt DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements,
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    /** 🔹 Count Query */
    const countResult = await db.sequelize.query(
      `
      SELECT COUNT(DISTINCT jc.id) AS count
      FROM transactions jc
      INNER JOIN enquiries e ON e.transaction_id = jc.id
      WHERE jc.outlet_id = :outlet_id
      `,
      {
        replacements: { outlet_id: user.outlet.id },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    const count = countResult[0]?.count || 0;

    return { enquiryDetails, count };

  } catch (err) {
    logger.error("Enquiry fetching error", err);
    throw err;
  }
};

const CreateOrGetEnquiryTokenForSocket = async (req) => {
  console.log("CreateOrGetEnquiryToken called")
  try {
    let token
    let FindToken
     FindToken=await EnquiryToken.findOne(
      {where:{outlet_id:req.user.outlet.id}}
    )
    let now = Date.now()- 5*60*1000; // 5 minutes early to avoid edge cases
    if(FindToken && FindToken.expires_at && FindToken.expires_at < now){
     let destroytoken= await EnquiryToken.destroy({where:{outlet_id:req.user.outlet.id}})
      FindToken=null
    }
    if(FindToken){
      token=FindToken.token
    }else{
       const response = await axios.post(
      `${EXTERNAL_API.ENQUIRY_BASE_URL}/auth/login`,
      {
    "username": req.user.outlet.outletCode,
    "password": "Tvs@123"
     },
      { headers: { "Content-Type": "application/json" } }
    );
    token= response?.data?.data?.token;
    let expiresIn= response?.data?.data?.expiresIn;
  const value = parseInt(expiresIn);
  let expires_at;
  if (expiresIn.endsWith('d')) expires_at = Date.now() + value * 24 * 60 * 60 * 1000;
  if (expiresIn.endsWith('h')) expires_at = Date.now() + value * 60 * 60 * 1000;
  if (expiresIn.endsWith('m')) expires_at = Date.now() + value * 60 * 1000;
  if (expiresIn.endsWith('s')) expires_at = Date.now() + value * 1000;


      const bodydata = {
    outlet_id: req.user.outlet.id,
    token: token,
    expires_at: expires_at,
    createdBy: req.user.id,
  };

  await EnquiryToken.create(bodydata);
  }
    
    return token
  } catch (err) {
    logger.error('New Enquiry error', err);
    next(err)
  }

};

const EnquiryService={
    FindEnquiry,
    CreateEnquiry,
    CreateEnquiryChat,
    CreateEnquiryIndent,
    UpdatePartIndent,
    GetEnquiryIndent,
    GetApiIndent,
    GetEnquiryChat,
    WebhookEnquiryChat,
    getEnquiry,
    CreateOrGetEnquiryToken,
    CreateOrGetEnquiryTokenForSocket
}

export default EnquiryService
import path from "node:path";
import logger from "../../../config/logger.js";
import EnquiryService from "./service.js";

const CreateEnquiry = async (req, res, next) => {
  let {enquiry,chat,enquiryindent,id} = req.body;
  enquiry=JSON.parse(enquiry)
  chat=JSON.parse(chat)
  enquiryindent=JSON.parse(enquiryindent)
  id=JSON.parse(id)
  let EnquiryData = null;
  try {
   
     EnquiryData=await EnquiryService.FindEnquiry(id)
    if(!EnquiryData){
     EnquiryData=await EnquiryService.CreateEnquiry(id,enquiry,req.enquiryToken,req.user)
    }
    
    let EnquiryChat=await EnquiryService.CreateEnquiryChat(req,chat,req.enquiryToken,EnquiryData,req.user)
    let EnquiryIndent=await EnquiryService.CreateEnquiryIndent(enquiryindent,EnquiryData,req.user)
    let UpdatePartIndent=await EnquiryService.UpdatePartIndent(enquiryindent,EnquiryData)
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Enquiry Successfully Created',
      // EnquiryData
    });
  } catch (err) {
         logger.error('Enquiry Contrller Error:', err);
     next(err);
};
}

const GetEnquiryIndent = async (req, res, next) => {
  const { enquiry_no, searchKey, limit, offset } = req.body;

  try {
    let ApiIndent = await EnquiryService.GetApiIndent(req.enquiryToken, { enquiry_no });
    let EnquiryIndent = await EnquiryService.GetEnquiryIndent(enquiry_no, req.user);

    let checkandmergeduplicate = [];

    if (Array.isArray(ApiIndent?.part_details) && ApiIndent.part_details.length > 0) {
      checkandmergeduplicate = ApiIndent.part_details.map((apiitem) => {
        const matchedItem = EnquiryIndent.find(
          (enqitem) => enqitem.indent_no === apiitem.part_reference
        );

        if (matchedItem) {
          EnquiryIndent = EnquiryIndent.filter(
            (item) => item.indent_no !== matchedItem.indent_no
          );
          return { ...apiitem, ...matchedItem };
        }

        return apiitem;
      });
    }

    let alldata = [...checkandmergeduplicate, ...EnquiryIndent];
    let combineddata = [...alldata];

    // Pagination
    if (limit !== 0 && offset !== 0) {
      combineddata = alldata.slice(offset, offset + limit);
    }

    // Search
    if (searchKey) {
      const filtereddata = combineddata.filter((item) =>
        item.part_name?.toLowerCase().includes(searchKey.toLowerCase()) ||
        item.part_no?.toLowerCase().includes(searchKey.toLowerCase()) ||
        item.indent_no?.toLowerCase().includes(searchKey.toLowerCase()) ||
        item.indent_name?.toLowerCase().includes(searchKey.toLowerCase())
      );

      return res.status(200).json({
        data: filtereddata,
        count: filtereddata.length,
        requestSuccessful: true,
        message: "Enquiry Indent Fetched Successfully",
      });
    }

    return res.status(200).json({
      data: combineddata,
      count: alldata.length,
      requestSuccessful: true,
      message: "Enquiry Indent Fetched Successfully",
    });

  } catch (err) {
    logger.error("Enquiry Indent Controller Error:", err);
    next(err);
  }
};


const GetEnquiryChat = async (req, res, next) => {
  const {enquiry_no}=req.body
  try {
    let EnquiryChat=await EnquiryService.GetEnquiryChat(enquiry_no,req.user)
    console.log(EnquiryChat,"enquiryChat")
    const responsedata = EnquiryChat.map((item) => ({
        created_at: item?.createdAt, 
        detail: item?.message,
        type: item?.isInternal==1 ? 0 :1,
        path: item?.file_url || null
    }))
    return res.status(200).json({
      data:responsedata,
      requestSuccessful: true,
      message: 'Enquiry Chat Fetched Successfully',
      
    });
  } catch (err) {
         logger.error('Enquiry Chat Contrller Error:', err);
     next(err);
};
}

const CreateEnquiryChat = async (req, res, next) => {
  let {enquiry,chat} = req.body;
  enquiry=JSON.parse(enquiry)
  chat=JSON.parse(chat)
  try {
    let EnquiryChat=await EnquiryService.CreateEnquiryChat(req,chat,req.enquiryToken,enquiry,req.user)
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Enquiry Chat Successfully Created',
      data:EnquiryChat
    });
  } catch (err) {
         logger.error('Enquiry Chat Contrller Error:', err);
     next(err);
};
}

const GetEnquiry = async (req, res, next) => {
  try {
    let { enquiryDetails: data, count } = await EnquiryService.getEnquiry(req.body, req.user);
    console.log(data, "data")
    const responsedata = data.map((item) => {
            const {enquirydate,...remain}=item

     const dateObj = new Date(enquirydate);

  const formattedDateTime = dateObj.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
      return ({
        ...remain,
        "Date & Time":formattedDateTime
      })
    })
    return res.status(200).json({
      requestSuccessful: true,
      message: "Enquiry data Fetched Successfully ",
      data: responsedata,
      count
    });

  } catch (err) {
    logger.error('Enquiry Contrller Error:', err);
    next(err);
  }
}

const CreateEnquiryOnly = async (req, res, next) => {
  let {enquiry,id} = req.body;
  
  console.log(req.body,"reqbody")
  let EnquiryData = null;
  try {
   
     EnquiryData=await EnquiryService.CreateEnquiry(id,enquiry,req.enquiryToken,req.user)
    
    return res.status(200).json({
      requestSuccessful: true,
      message: 'Enquiry Successfully Created',
      enquiry_no:EnquiryData?.enquiry_no,
      enquiry_id:EnquiryData?.id
    });
  } catch (err) {
         logger.error('Enquiry Contrller Error:', err);
     next(err);
};
}

const CreateOrGetEnquiryTokenForSocket = async (req, res, next) => {
  try {
    let enquiryToken=await EnquiryService.CreateOrGetEnquiryTokenForSocket(req)
    console.log(enquiryToken,"enquiryToken")
    return res.status(200).json({
      token:enquiryToken,
      requestSuccessful: true,
      message: 'Enquiry token Fetched Successfully',
      
    });
  } catch (err) {
         logger.error('Enquiry Token Contrller Error:', err);
     next(err);
};
}
const controller={
    CreateEnquiry,GetEnquiryIndent,GetEnquiryChat,
    CreateEnquiryChat,GetEnquiry,CreateEnquiryOnly,CreateOrGetEnquiryTokenForSocket
}

export default controller;

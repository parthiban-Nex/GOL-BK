import logger from "../../config/logger.js";
import CheckListDao from "./dao.js";


const getCheckListData = async (reqData) => {
    let checkListData = {}
    let result = {};

    try {

        result.requestSuccessful = true;
        result.checkListData = await CheckListDao.getCheckListData(reqData)
        // console.log("CheckListData " , JSON.stringify(checkListData, null, 2));

        return result;

    } catch (err) {
        result.requestSuccessful = false;
        logger.error('getCheckListData error: ', err)
    }
}

const saveCheckList = async (reqData) => {
    try {
        const result = await CheckListDao.saveCheckList(reqData);

        if (result.status) {
            return {
                status: 'success'
            }
        } else {
            return {
                status: 'failed',
                message: result.message
            }
        }

    } catch (err) {
        result.requestSuccessful = false;
        logger.error('getCheckListData error: ', err)
    }
}

const CheckListService = {
    getCheckListData,
    saveCheckList
};

export default CheckListService;
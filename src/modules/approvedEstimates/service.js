import approvedEstimatesDAO from "./dao.js";
import logger from "../../config/logger.js";
import RecentAcivityService from "../recentActivity/service.js";

const listApprovedEstimates = async(reqData, user) => {
    try{
        const data = await approvedEstimatesDAO.listApprovedEstimates(reqData, user);
        return data;
    } catch (err) {
        logger.error('Approved Estimates listApprovedEstimates service:', err);
    };
};

const setApprovalStatus = async (reqData, user) => {
    try {
        const data = await approvedEstimatesDAO.setApprovalStatus(reqData, user);
        return data;
    } catch (err) {
        logger.error('Approved Estimates setApprovalStatus service:', err);
    }
}

const approvedEstimatesService = {
    listApprovedEstimates,
    setApprovalStatus
};

export default approvedEstimatesService;

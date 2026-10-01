import clickinService from './service.js';



const getInspectionLink = async (req, res) => {
    const getInspectionLink = await clickinService.getInspectionLink(req.body);
    console.log("getInspectionLink", getInspectionLink);

    if (getInspectionLink.status) {
        return res.status(200).send({
            inspectionLink: getInspectionLink.token
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: 'No data found'
        });
    }
}

const clickinautosaveestimate = async (req, res) => {
    const clickinautosaveestimate = await clickinService.clickinautosaveestimate(req.body);
    console.log("clickinautosaveestimate", clickinautosaveestimate);

    if (clickinautosaveestimate.status) {
        return res.status(200).send({
            status: "Success"
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: clickinautosaveestimate.message
        });
    }
}

const clickinpostcallback = async (req, res) => {
    const clickinpostcallback = await clickinService.clickinpostcallback(req.body);
    console.log("clickinpostcallback", clickinpostcallback);

    if (clickinpostcallback.status) {
        return res.status(200).send({
            status: "Success"
        });
    } else {
        return res.status(400).send({
            requestSuccessful: false,
            message: clickinpostcallback.message
        });
    }
}

const controller = {
    getInspectionLink,
    clickinautosaveestimate,
    clickinpostcallback
};


export default controller;
import db from '../index.js';
import CheckListService from "./service.js";
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import JwtConfig from '../../config/jwtConfig.js';
import auditLog from '../../shared/auditLog.js';
import logger from '../../config/logger.js';
import EmpoyeeDao from '../employee/dao.js';
import { recordLoginFailure, resetUserLoginAttempts } from '../../config/loginRateLimiter.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import whatsAppMinorController from './whatsAppMinorDentAndInventory.js';
import InspectionWhatsApp from './SendWhatsAppMessage.js';

import InspectionReportMessage from './inspectionReport.js';

import _ from 'lodash';
import GoogleController from './google.js';

const saveCheckList = async (req, res) => {
  try {
    let result = await CheckListService.saveCheckList(req);

    if (result.status == 'success') {

      if (req.body.Parent.VISIT_STATUS == "JC_TO_GENERATE") {
        req.body.INSPECTION_MODE = "PRE_INSPECTION";
        let result = await CheckListService.getCheckListData(req);
        let checkListValue = result.checkListData.checkListValue;
        console.log('result', result);
        // whatsAppinspectiondata(req.body.VISIT_ID, result.checkListData.Checklist, checkListValue);
      }

      return res.status(200).json({
        requestSuccessful: true,
        message: "CheckList Saved",
      });
    } else {
      return res.status(500).json({
        resultCode: 1,
        resultText: "failed",
        message: result.message,
      });
    }
  } catch (err) {
    logger.error('Controller saveCheckList Error:', err);
    return res.status(500).json({
      resultCode: 1,
      resultText: "failed",
    });
  }
}

const getCheckList = async (req, res, next) => {
  try {
    let result = await CheckListService.getCheckListData(req);
    let checkListValue = result.checkListData.checkListValue;
    console.log('result', result);
    let response = {
      requestSuccessful: true,
    };
    if (result.checkListData.status) {
      // TODO : Below one need to change to savechecklist
      whatsAppinspectiondata(req.body.VISIT_ID, result.checkListData.Checklist, checkListValue);
      return res.status(200).send({
        [checkListValue]: result.checkListData.Checklist,
        CarpmList: result.checkListData.carpm
      });
    } else if (result.checkListData.status == false) {
      return res.status(400).send({
        message: result.checkListData.message
      });
    } else {
      return res.status(200).send({
        requestSuccessful: false
      });
    }
  } catch (err) {
    logger.error('Controller getCheckList Error:', err);
    next(err);
  }
} // Okay TODO : CHECK SAVE INSPECTION PHP ALSO ( 1. Send inspection through whats app )


async function whatsAppinspectiondata(visitId, checkList, checkListType) {
  let RatingPromptOne = [];
  let RatingPromptTwo = [];
  let RatingOneCount = 0;
  let RatingTwoCount = 0;
  let ratingParamIndex = 0;
  let ratingComponentIndex = 0;
  let ratingTotalComponents = 0;
  let reMessage = '';

  const severalVariants = [
    'Several other components were found with issues',
    'Multiple components need to be addressed',
    'Several other components were reported with issues',
    'Multiple additional components require attention',
    'Various other components require attention',
  ];

  const fewVariants = [
    'Few additional components need attention',
    'Some more components were found with issues',
    'Few components were reported with issues',
    'Few more components need to be addressed',
    'Some more components need attention',
    'Few other components require attention',
  ];

  const ratingMapping = {
    ENGINE: [
      "ENGINE_OIL_LEAK", "ENGINE_OIL", "FUEL_SYSTEM", "EGR", "AIR_FILTER",
      "BELTS_IDLERS", "SILENCER", "RADIATOR", "HOSE_PIPE", "SPARK_PLUG",
      "IGNITION_COIL", "HIGH_TENSION_CABLE", "BRAKE_OIL", "COOLANT"
    ],
    BATTERY: [
      "BATTERY_VOLTAGE", "BATTERY_ELECTROLYTES", "BATTERY_CORROSION"
    ],
    SUSPENSION: [
      "SUSPENSION_NOISE", "SUSPENSION_RECOIL", "DRIVING_EXPERIENCE"
    ],
    BRAKES: [
      "BRAKE_FLUID_LEAK", "HAND_BRAKE", "BRAKE_SHOE_CONDITION", "ABS",
      "FRONT_BRAKE_PAD_DISC", "REAR_BRAKE_PAD_DISC"
    ],
    TIRE: [
      "TIRE_WEAR_TEAR", "TIRE_CUTS_BUBBLES", "RIMS", "FRONT_TIRE_TREAD",
      "REAR_TIRE_TREAD", "WHEEL_BEARINGS"
    ],
    STEERING: [
      "EPS", "STEERING_RACK_PINION", "STEERING_VIBRATIONS",
      "STEERING_SWAYING", "TURN_RESISTANCE"
    ],
    TRANS: [
      "DIFFERENTIAL_FLUID_LEAKAGE", "SMOOTH_GEAR_SHIFT", "CLUTCH",
      "TRANSMISSION_FLUID", "DRIVE_SHAFT"
    ],
    ELECTRICAL: [
      "SELF_START", "ALTERNATOR", "AIR_CONDITIONING", "WIPERS", "HORN",
      "FAN_NOISE", "WARNING_LIGHTS", "ALL_LAMPS", "SWITCHES"
    ],
    EXTERIOR: [
      "EXTERIOR_PAINT", "WIPER_BLADES", "WINDSHIELD_CRACKS",
      "WIPER_FLUID_LEVEL", "DENTS_SCRATCHES"
    ],
    INTERIOR: [
      "MIRROR_ADJUSTMENTS", "WINDOW_ADJUSTMENTS", "CENTRAL_LOCKING",
      "SEAT_BELTS", "SEAT_ADJUSTMENTS", "DASHBOARD_LIGHTS"
    ]
  };

  let ratingComponentsLabels = ['ENGINE', 'BATTERY', 'SUSPENSION', 'BRAKES', 'TIRE', 'STEERING', 'TRANS', 'ELECTRICAL', 'EXTERIOR', 'INTERIOR'];


  const groupedChecklist = {};

  if (checkListType.includes("MAJOR")) {
    for (const [category, paramNames] of Object.entries(ratingMapping)) {
      const matchedItems = checkList.filter(item =>
        paramNames.includes(item.PARAM_NAME) &&
        ['1', '2'].includes(String(item.PARAM_RATING))
      );
      groupedChecklist[category] = matchedItems;
      ratingTotalComponents += matchedItems.length;
    }

    while (
      ((RatingPromptOne.length + RatingPromptTwo.length) < ratingTotalComponents &&
        (RatingPromptOne.length + RatingPromptTwo.length) < 5)
    ) {
      const category = ratingComponentsLabels[ratingComponentIndex];
      if (groupedChecklist[category].length > 0) {
        const element = groupedChecklist[category][ratingParamIndex]
        const PARAM_RATING = element.PARAM_RATING;
        if (PARAM_RATING == '1') {
          const reasons = element.RATING
            .map(r => r.RATING_REASON_VALUE)
            .join(' , ');

          RatingPromptOne.push(
            `${element.PARAM_VALUE}:${reasons}`
          );
        } else if (PARAM_RATING == '2') {
          const reasons = element.RATING
            .map(r => r.RATING_REASON_VALUE)
            .join(' , ');

          RatingPromptTwo.push(
            `${element.PARAM_VALUE}:${reasons}`
          );
        }
      }

      if (ratingComponentIndex == ratingComponentsLabels.length - 1) {
        ratingComponentIndex = 0;
        ratingParamIndex++
      } else {
        ratingComponentIndex++
      }
    }

  } else {
    checkList.forEach(element => {
      // console.log('element', element);
      if (element.RATING.length > 0) {
        if (element.PARAM_RATING == '1') {
          if (RatingPromptOne.length < 5) {
            const reasons = element.RATING
              .map(r => r.RATING_REASON_VALUE)
              .join(' , ');

            RatingPromptOne.push(
              `${element.PARAM_VALUE}:${reasons}`
            );
          }
          RatingOneCount++;
        } else if (element.PARAM_RATING == '2') {
          if (RatingPromptTwo.length < 5) {
            const reasons = element.RATING
              .map(r => r.RATING_REASON_VALUE)
              .join(' , ');

            RatingPromptTwo.push(
              `${element.PARAM_VALUE}:${reasons}`
            );
          }
          RatingTwoCount++;
        }
      }
    }
    );
  }




  const remaningCountDifference = (RatingOneCount + RatingTwoCount) - (RatingPromptOne.length + RatingPromptTwo.length)

  if (remaningCountDifference > 5) {
    reMessage = severalVariants[Math.floor(Math.random() * severalVariants.length)];
  } else if (remaningCountDifference < 5 && remaningCountDifference > 0) {
    reMessage = fewVariants[Math.floor(Math.random() * fewVariants.length)];
  }

  if (RatingPromptOne.length > 0 || RatingPromptTwo.length > 0) {
    const accessToken = 'ya29.c.c0AYnqXljGSyRzi3r2ooi0teLan-1xE-zgEDimjKNjk3Ki866mdEr5mBPW1AMEbv8GYEevTRBqbKwm38-V47uiy2Kafom-NIjJ775Au0Otd9dwq_1Am6NgMlsEOHBQO7oL13zyelMpyvKAo6U27fYaqLoBguIV25JzbOYJ1_tKkAUlrnlzIYJgAXJT8Z-tabMYZyV9p8jUeUuFNW4Pz-5yjDQ6WU6UTb53rbcgB5tCpeOLu0zA-VcnlD6bp5YWHUpx4kBBAML1dnevGeDR3Cac9B2vOHYPGuFPf6YBRPkV2BMu-fK6ECY18ncpgyFEHPSY9t-q_RY6RvjjpTNhm2lwgGmkLA-STYCNWPJYRn_wgOPtiXsKWCUXnYxwH385D89uqXcOlSu3kiRyBzvtppIVRlVfic78dIfm2p91Sgj5OrF-Ul55QtvzjtrFjBr1exYjxhhuFjIsd3O1kJw3-Xj5RhcZ5J9yyOanW-70jjvS922hF8ppMtd9MVjSggFq3yFtbOOiwrmii_MIcjrx9-nlgbYFFcgZXyp2pW6pa61ZvZc5y48oUjw29qvs9-1eucqje67Rt3MjZ7_JvMguRy-00i5mY1zq61okhq0p4_cz5Ian1hq0O7M4raUeoZn6hS_qoZiVm0WfnkjvwwciM5B-r94ejFpqVoc3Qnsc--mVs0mtqm95yBewen7MI4Skp4Z7QcbhoY183Q75hS6p3tm5WIlcQ4Id-5RxUIUlt4RdMrrYs7ZcoqelwbhkfmWYnsopYvu3x9Sl65aRs1oxYB19uRtWMjmM5yh6mj7Mfe45F4yzM6lt5QIqj_eb1Ss43-i8Jj4YZM9ipIhOFy6zqYwhaBRW3MrW4z2mtlkMbsk6feWxliUenz1WV0_qd_JZQ1dUU4Ftgz4zYidg2I2B8meZ27pp512nrr6gdwYOljxioyqyr081mxeQ4m1ZXz3tB1mhSgUQwF9Zy8x1MeXcgU1Zds2jglnvWxJvq0dzMt6d5BJXhv0ulvj-f4u'
    whatsAppinspectionreport(visitId, RatingPromptOne, RatingPromptTwo, accessToken, reMessage);
  }
  console.log('RatingPromptOne', RatingPromptOne);
  console.log('RatingPromptTwo', RatingPromptTwo);
}

async function whatsAppinspectionreport(visitId, RatingPromptOne, RatingPromptTwo, accessToken, reMessage) {

  let prompt = `You are an AI assistant that generates car inspection report summaries. Follow all instructions precisely. 
### INSTRUCTIONS ### 
1. **Goal**: Generate a concise car inspection report summary in natural language. 
2. **Structure**: The response must only contain the sections for which data is provided in the ### INPUT DATA ### block. The required section headers are 'Inspection Findings', 'Exterior Damage', and 'Inventory Status'. Always end section headers ('Inspection Findings', 'Exterior Damage', and 'Inventory Status') with a colon (:) before the summarized content. 
3. **Crucial Rule 1 (Omission)**: If a section in the INPUT DATA is empty or missing, you MUST omit its header and content entirely from the final report. Do not output empty sections or placeholder text. 
4. **Crucial Rule 2 (Data Integrity)**: Do NOT move data between sections. You must summarize the data under the exact same section header where it was found in the ### INPUT DATA ###. For example, if damage information is listed under Inventory Status, you must report it under Inventory Status. 
5. **Voice & Tone**: 
- Use passive voice and present tense consistently (e.g., 'A dent is present,' not 'We noted a dent' or 'A dent was noted'). 
- Summarize only the provided input data. Do not infer, add, or hallucinate information. 
6. **Section-Specific Guidance**: 
- **Inspection Findings**: 
- **Faulty Components**: For each finding, you MUST clearly state both the **component** and its **condition**. Do not omit the component's name for conciseness. For example, for an input like ENGINE_OIL: 'Oil poor viscosity', the summary must clearly state that 'The engine oil has poor viscosity', not just 'Poor viscosity is present'. 
- **Rating=1 (Urgent)**: Use an urgent tone. Group up to 2-3 items into a single concise sentence. End with one of the following urgency phrases, and vary them across sentences if there are multiple Rating=1 items: 'requires immediate attention', 'should be addressed at the earliest', or 'needs to be addressed promptly'. 
- **Rating=2 (Advisory)**: Use a softer, observational tone. Group 2-3 items into a single sentence wherever possible. 
- **Note**: If a Note exists, add it as the last sentence. Start it with one of the following connectors: 'Furthermore', 'Also', or 'Further.' 
- **Exterior Damage**: Describe physical damage neutrally and passively using present tense (e.g., 'Scratches are present on the surface.'). 
- **Inventory Status**: Formally describe the presence or absence of items using present tense (e.g., 'Four mats and two mirrors are present.'). 
7. **Grammar Requirements**: 
- Maintain consistent present tense throughout the entire report. 
- Avoid run-on sentences by limiting each sentence to 2-3 items maximum. 
- Use proper sentence structure and punctuation.

### INPUT DATA ###`;

  if (RatingPromptOne.length > 0 || RatingPromptTwo.length > 0) {
    prompt += '# Inspection Findings';
    if (RatingPromptOne.length > 0) {
      prompt += '\nRating=1: ' + RatingPromptOne;
    }
    if (RatingPromptTwo.length > 0) {
      prompt += '\nRating=2 : ' + RatingPromptTwo;
    }
    if (reMessage) {
      prompt += '\nNote: ' + reMessage;
    }
  }

  const dentandamges = await whatsAppMinorController.dentAndScratch(visitId)

  console.log('dentandamges', dentandamges);
  if (dentandamges.dentsDamageScratch) {
    prompt += '\n # Exterior Damage';
    prompt += '\n' + JSON.stringify(dentandamges.dentsDamageScratch);
  }

  if (dentandamges.inventoryData) {
    prompt += '\n # Inventory';
    prompt += '\n' + JSON.stringify(dentandamges.inventoryData);
  }


  const requestPayload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: 2048, // TODO : NEED TO CHANGE TO 512 SHASHI 
      temperature: 0.3,
      topP: 0.95
    }
  };
  const inspectionMessage = await InspectionReportMessage.callMinorApi("POST", requestPayload, accessToken)
  if (inspectionMessage.httpcode == 401) {
    const accessToken = await GoogleController.AccessToken();
    whatsAppinspectionreport(visitId, RatingPromptOne, RatingPromptTwo, accessToken);
  } else {
    // console.log('message', JSON.stringify(inspectionMessage, null, 2))
    console.log('message', inspectionMessage.candidates[0].content.parts[0].text)
    InspectionWhatsApp.sendWhatsAppMessage(inspectionMessage.candidates[0].content.parts[0].text, visitId)
  }
}

const ChecklistController = {
  saveCheckList,
  getCheckList,
  whatsAppinspectionreport
}

export default ChecklistController;

import db from '../index.js';
import utils from '../Utils/Utils.js';


const dentAndScratchData = db.saveDentAndScratch

const dentAndScratch = async (visitId) => {
    const sqlDentResults = await dentAndScratchData.findAll({
        where: {
            VISIT_ID: visitId
        }
    })

    if (Array.isArray(sqlDentResults) && sqlDentResults.length) {

        const grouped = {};

        for (const row of sqlDentResults) {
            const position = classifyDentPosition(row.X_POINT, row.Y_POINT);
            const type = row.TYPE;

            if (!grouped[visitId]) grouped[visitId] = {};
            if (!grouped[visitId][type]) grouped[visitId][type] = [];

            grouped[visitId][type].push(position);
        }

        const dentsDamageScratch = {};

        for (const visitKey in grouped) {
            const row = grouped[visitKey];

            if (row.DAMAGE) {
                dentsDamageScratch.DAMAGE_DETAILS = row.DAMAGE;
            }

            if (row.SCRATCH && row.SCRATCH.length > 0) {
                dentsDamageScratch.SCRATCH_DETAILS =
                    'SCRATCHES present on the Vehicle';
            }

            if (row.DENT) {
                const dentItems = [
                    'left front bumper',
                    'right front bumper',
                    'left rear bumper',
                    'right rear bumper',
                    'left front door',
                    'right front door',
                    'left rear door',
                    'right rear door'
                ];

                // count occurrences
                const dentCounter = {};
                row.DENT.forEach(pos => {
                    dentCounter[pos] = (dentCounter[pos] || 0) + 1;
                });

                // filter allowed regions
                const filteredDent = {};
                for (const key of dentItems) {
                    if (dentCounter[key]) {
                        filteredDent[key] = dentCounter[key];
                    }
                }

                const [processedDent, info] = processDent(filteredDent);
                if (info) {
                    processedDent.Additional_DENT_Regions = info;
                }

                dentsDamageScratch.DENT_DETAILS = processedDent;
            }
        }

        // final result
        console.log(dentsDamageScratch);

        const inventory = await utils.getInventory(visitId);

        // console.log('inventory',inventory)
        let inventoryData = [];

        if (inventory) {
            inventory.forEach(inv => {
                if (inv.INVENTORY_CONDITION == 'BAD' || inv.INVENTORY_CONDITION == 'NA') {
                    inventoryData.push(
                        `${inv.INVENTORY_DESC}:${inv.REMARKS}`
                    )
                }
            })
        }

        return {
            dentsDamageScratch: dentsDamageScratch,
            inventoryData: inventoryData && inventoryData.length > 0
                ? inventoryData
                : null
        }
    }

}

function classifyDentPosition(x, y) {
    if (x > 0 && x <= 0.5) {
        if (y > 0 && y <= 0.25) return 'left front bumper';
        else if (y <= 0.5) return 'left front door';
        else if (y <= 0.75) return 'left rear door';
        else if (y <= 1) return 'left rear bumper';
    } else if (x <= 1) {
        if (y > 0 && y <= 0.25) return 'right front bumper';
        else if (y <= 0.5) return 'right front door';
        else if (y <= 0.75) return 'right rear door';
        else if (y <= 1) return 'right rear bumper';
    }
    return 'unknown';
}


function processDent(dentDict) {
    const entries = Object.entries(dentDict);

    if (!entries.length) return [dentDict, null];

    // sort by count desc, then key asc
    entries.sort((a, b) => {
        if (b[1] === a[1]) return a[0].localeCompare(b[0]);
        return b[1] - a[1];
    });

    const numRegions = entries.length;
    const top = numRegions <= 1 ? entries.slice(0, 1) : entries.slice(0, 2);

    const damageDict = {};
    for (const [key, value] of top) {
        damageDict[key] = Number.isInteger(value) && value > 5
            ? 'MAJOR DENT'
            : 'DENT';
    }

    if (numRegions <= 1) {
        return [damageDict, null];
    }

    return [damageDict, `${numRegions - 2} more regions`];
}

const whatsAppMinorController = {
    classifyDentPosition,
    processDent,
    dentAndScratch
}

export default whatsAppMinorController;
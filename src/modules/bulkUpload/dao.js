import db from '../index.js';
import { Op, literal } from 'sequelize';
import encryptConfig from '../../config/encrypt.js';
import bcrypt from 'bcrypt';

const Item = db.items;
const ItemCompanyMap = db.itemcompanymaps;
const LaborSchedule = db.laborschedules;
const LaborCompanyMaps = db.laborcompanymaps;
const ItemGroups = db.itemgroups;
const ItemCategories = db.itemcategories;
const UOMs = db.uom;
const HSN = db.hsns;
const Make = db.makes;
const Model = db.models;
const Aggregate = db.aggregates;
const SubAggregate = db.subaggregates;
const Comapanies = db.companies;
const MakeCompanyMaps = db.makecompanymaps;
const ModelCompanyMaps = db.modelcompanymaps;
const Varient = db.varients;
const PinCode = db.pincodes;
const Source = db.sources;
const SourceType = db.sourcetypes;
const CustomerCategory = db.customercategory;
const CustomerType = db.customertypes;
const Customers = db.customers;
const Vehicles = db.vehicles;
const Outlet = db.outlets;
const EmployeeRole = db.employeeroles;
const Employee = db.employees;
const Roles = db.role;
const User = db.users;
const UserRoleMap = db.userrolemaps;
const EmployeeOutletMap = db.employeeoutletmap;

const insertItems = async (data, userId) => {
  const items = data.slice(1).map((row) => {
    const [
      itemCode, itemName, itemDescription, itemgroupCode, uom, itemcategory,
      hsnCode, make, model, aggregate, subaggregate,
      list, mrp, cost, taxPercentage, status, companyName
    ] = row;

    const now = new Date();

    let itemgroupId = itemgroupCode;
    let itemcategoryId = itemcategory;
    let uomId = uom;
    let makeId = make;
    let modelId = model;
    let aggregateId = aggregate;
    let subaggregateId = subaggregate;
    let hsnId = "";
    return {
      itemCode,
      itemName,
      itemDescription,
      itemgroupId,
      uomId,
      itemcategoryId,
      hsnCode,
      makeId:makeId ? makeId?.toString().trim()?.toUpperCase() : null,
      modelId:modelId ? modelId?.toString().trim()?.toUpperCase() : null,
      aggregateId,
      subaggregateId,
      list,
      mrp,
      cost,
      taxPercentage,
      vehicletypeId: 1,
      status: 1,
      companyName,
      hsnId,
      createdBy: userId
    };
  });

  const totalRows = items.length;
  let insertedRows = 0;

  try {
    const existingItems = await Item.findAll({
      where: {
        itemCode: items.map(item => item.itemCode)
      },
      attributes: ['itemCode']
    });

    const existingItemCodes = existingItems.map(item => item.itemCode);
    const newItems = items.filter(
      item => {
        return (
          !existingItemCodes.includes(item.itemCode) &&
          item.itemCode !== '' && item.itemCode !== 'undefined' &&
          item.itemCode !== 'null' && item.itemCode !== null && item.itemCode !== undefined
        )
      });

    if (newItems.length > 0) {
      // Item Group
      const existingItemGroups = await ItemGroups.findAll({
        where: {
          itemGroupCode: items.map(item => item.itemgroupId)
        },
        attributes: ['itemGroupCode', 'id']
      });
      const itemGroupMap = {};
      existingItemGroups.forEach(group => {
        itemGroupMap[group.itemGroupCode] = group.id;
      });

      const newItemGroups = newItems.filter(item => !itemGroupMap.hasOwnProperty(item.itemgroupId) && item.itemgroupId !== null
        && item.itemgroupId !== undefined);
      let insertedItemGroups = [];
      if (newItemGroups.length > 0) {
        insertedItemGroups = await ItemGroups.bulkCreate(
          newItemGroups.filter(item => item.itemgroupId).map(item => ({
            itemGroupCode: item.itemgroupId,
            itemGroupDescription: "Bulk",
            status: 1,
            createdBy: userId
          })),
          { validate: true, ignoreDuplicates: true }
        );
        insertedItemGroups
          .filter(group => group.id !== null)
          .forEach(group => {
            itemGroupMap[group.itemGroupCode] = group.id;
          });
        // console.log(`${insertedItemGroups.length} new item groups created successfully.`);
      };

      newItems.forEach(item => {
        item.itemgroupId = itemGroupMap[item.itemgroupId] || item.itemgroupId;
      });

      // UOM
      const existingUOMs = await UOMs.findAll({
        where: {
          uomType: items.map(item => item.uomId)
        },
        attributes: ['uomType', 'id']
      });
      const uomMap = {};
      existingUOMs.forEach(uom => {
        uomMap[uom.uomType] = uom.id;
      });

      const newUOMs = newItems.filter(item => !uomMap.hasOwnProperty(item.uomId));
      let insertedUOMs = [];
      if (newUOMs.length > 0) {
        insertedUOMs = await UOMs.bulkCreate(
          newUOMs.filter(item => item.uomId).map(item => ({
            uomType: item.uomId,
            uomDescription: "Bulk",
            status: 1,
            createdBy: userId
          })),
          { validate: true, ignoreDuplicates: true }
        );
        insertedUOMs
          .filter(uom => uom.id !== null)
          .forEach(uom => {
            uomMap[uom.uomType] = uom.id;
          });
        // console.log(`${insertedUOMs.length} new UOMs created successfully.`);
      };

      newItems.forEach(item => {
        item.uomId = uomMap[item.uomId];
      });

      // Item Categories
      const existingItemCategories = await ItemCategories.findAll({
        where: {
          itemCategorie: items.map(item => item.itemcategoryId)
        },
        attributes: ['itemCategorie', 'id']
      });
      const itemCategoryMap = {};
      existingItemCategories.forEach(category => {
        itemCategoryMap[category.itemCategorie] = category.id;
      });

      const newItemCategories = newItems.filter(item => !itemCategoryMap.hasOwnProperty(item.itemcategoryId));
      let insertedItemCategories = [];
      if (newItemCategories.length > 0) {
        insertedItemCategories = await ItemCategories.bulkCreate(
          newItemCategories.filter(item => item.itemcategoryId).map(item => ({
            itemCategorie: item.itemcategoryId,
            itemCategorieDescription: "Bulk",
            status: 1,
            createdBy: userId
          })),
          { validate: true, ignoreDuplicates: true }
        );
        insertedItemCategories
          .filter(category => category.id !== null)
          .forEach(category => {
            itemCategoryMap[category.itemCategorie] = category.id;
          });
        // console.log(`${insertedItemCategories.length} new item categories created successfully.`);
      }

      newItems.forEach(item => {
        item.itemcategoryId = itemCategoryMap[item.itemcategoryId];
      });

      // HSN

const hsnCodes = [...new Set(newItems.map(i => i.hsnCode).filter(Boolean))];

// 1. Find existing HSN rows
const existingHSN = await HSN.findAll({
  where: { hsnCode: hsnCodes },
  attributes: ["id", "hsnCode", "tax"]
});

const hsnMap = {};

// Map existing HSNs
existingHSN.forEach(hsn => {
  hsnMap[hsn.hsnCode] = hsn.id;
});

// 2. Assign hsnId for items that already exist in DB
newItems.forEach(item => {
  if (hsnMap[item.hsnCode]) {
    item.hsnId = hsnMap[item.hsnCode];
  }
});

// 3. Determine NEW HSN codes (not present in DB)
const newHSNRecords = hsnCodes
  .filter(code => !hsnMap[code])   // only missing codes
  .map(code => {
    return {
      hsnCode: code,
      tax: newItems.find(i => i.hsnCode === code)?.taxPercentage || 0,
      status: 1,
      createdBy: userId
    };
  });

let insertedHSNs = [];

// 4. Insert NEW HSNs
if (newHSNRecords.length > 0) {
  insertedHSNs = await HSN.bulkCreate(newHSNRecords, {
    validate: true,
    ignoreDuplicates: true
  });

  insertedHSNs.forEach(hsn => {
    hsnMap[hsn.hsnCode] = hsn.id;
  });
}

// 5. FINAL assignment of hsnId AFTER insert
newItems.forEach(item => {
  item.hsnId = hsnMap[item.hsnCode];  // ALWAYS produces proper ID
});


      // Make
     const uniqueMake = [...new Set(newItems.map(i => i.makeId).filter(Boolean))];
const existingMake = await Make.findAll({
  where: { makeName: uniqueMake },
  attributes: ["id", "makeName"]
});
const makeMap = {};
existingMake.forEach(m => makeMap[m.makeName] = m.id);
// const newMakeRecords = uniqueMake
//   .filter(code => !makeMap[code])
//   .map(code => ({
//     makeName: code,
//     makeDescription:code,
//     status: 1,
//     createdBy: userId
//   }));

// if (newMakeRecords.length > 0) {
// const  insertedMake = await Make.bulkCreate(newMakeRecords, {
//     validate: true,
//     ignoreDuplicates: true
//   });

//   insertedMake.forEach(m => {
//     makeMap[m.makeName] = m.id;
//   });
// }
newItems.forEach(item => {
  item.make = makeMap[item.makeId] || null;
});


//       // Model
const uniqueModels = [...new Set(newItems.map(i => i.modelId).filter(Boolean))];

const existingModels = await Model.findAll({
  where: { modelName: uniqueModels },
  attributes: ["id", "modelName"]
});

const modelMap = {};
existingModels.forEach(m => modelMap[m.modelName] = m.id);

// Create only models that have valid makeId
// const newModelRecords = uniqueModels
//   .filter(code => !modelMap[code])      // not already in DB
//   .map(code => {
//     const ref = newItems.find(i => i.modelId === code);

//     if (!ref || !ref.make) return null;

//     return {
//       modelName: code,
//       makeId: ref.make,
//       modelDescription: code,
//       // segment: "A",
//       // vehicletypeId: 1,
//       // varientId: 1,
//       status: 1,
//       createdBy: userId
//     };
//   })
//   .filter(Boolean);



// if (newModelRecords.length > 0) {
//   const insertedModels = await Model.bulkCreate(newModelRecords, {
//     validate: true,
//     ignoreDuplicates: true
//   });

//   insertedModels.forEach(m => modelMap[m.modelName] = m.id);
// }

newItems.forEach(i => {
  i.model = modelMap[i.modelId];
});


      // Aggregate
      const existingAggregate = await Aggregate.findAll({
        where: {
          aggregateName: items.map(item => item.aggregateId)
        },
        attributes: ['aggregateName', 'id']
      });
      const aggregateMap = {};
      existingAggregate.forEach(aggregate => {
        aggregateMap[aggregate.aggregateName] = aggregate.id;
      });

      const newAggregate = newItems.filter(item => !aggregateMap.hasOwnProperty(item.aggregateId));
      let insertedAggregate = [];
      if (newAggregate.length > 0) {
        insertedAggregate = await Aggregate.bulkCreate(
          newAggregate.filter(item => item.aggregateId).map(item => ({
            aggregateName: item.aggregateId,
            status: 1,
            createdBy: userId
          })),
          { validate: true, ignoreDuplicates: true }
        );
        insertedAggregate
          .filter(aggregate => aggregate.id !== null)
          .forEach(aggregate => {
            aggregateMap[aggregate.aggregateName] = aggregate.id;
          });
        // console.log(`${insertedAggregate.length} new Aggregates created successfully.`);
      }

      newItems.forEach(item => {
        item.aggregateId = aggregateMap[item.aggregateId];
      });

      // Sub-aggregate
      const existingSubAggregate = await SubAggregate.findAll({
        where: {
          subAggregateName: items.map(item => item.subaggregateId)
        },
        attributes: ['subAggregateName', 'id']
      });
      const subaggregateMap = {};
      existingSubAggregate.forEach(subaggregate => {
        subaggregateMap[subaggregate.subAggregateName] = subaggregate.id;
      });

      const newSubAggregate = newItems.filter(item => !subaggregateMap.hasOwnProperty(item.subaggregateId));
      let insertedSubAggregate = [];
      if (newSubAggregate.length > 0) {
        insertedSubAggregate = await SubAggregate.bulkCreate(
          newSubAggregate.filter(item => item.aggregateId&&item.subaggregateId).map(item => ({
            subAggregateName: item.subaggregateId,
            status: 1,
            aggregateId: item.aggregateId,
            createdBy: userId
          })),
          { validate: true, ignoreDuplicates: true }
        );
        insertedSubAggregate
          .filter(subaggregate => subaggregate.id !== null)
          .forEach(subaggregate => {
            subaggregateMap[subaggregate.subAggregateName] = subaggregate.id;
          });
        // console.log(`${insertedSubAggregate.length} new Sub-Aggregates created successfully.`);
      }

      newItems.forEach(item => {
        item.subaggregateId = subaggregateMap[item.subaggregateId];
      });
    }

    if (newItems.length > 0) {

      newItems.forEach(item => {
        item.companyName = item.companyName
          ? item.companyName.toString().trim().toLowerCase()
          : "";
      });
      // get unique names 
      const uniqueCompanyNames = [...new Set(
        newItems.flatMap(item =>
          item.companyName.split(',').map(name => name.trim()).filter(name => name !== "")
        )
      )];

      const existingCompanies = await Comapanies.findAll({
        where: { name: uniqueCompanyNames },
        attributes: ['name', 'id']
      });

      const companyMap = {};
      existingCompanies.forEach(company => {
        companyMap[company.name.toLowerCase()] = company.id;
      });

      newItems.forEach(item => {
        const companies = item.companyName.split(',')
          .map(name => name.trim().toLowerCase())
          .filter(name => name in companyMap);
        item.companyIds = companies.map(name => companyMap[name]);
      });

      const validItems = newItems.filter(item => (
        // item.itemgroupId && item.uomId && item.itemcategoryId && 
        item.hsnCode 
        // &&
        // item.makeId && item.modelId && item.aggregateId && item.subaggregateId
      ));

      if (validItems.length > 0) {
        const insertedItems = await Item.bulkCreate(validItems.map((item) => ({
          // map the properties of item as needed
          ...item,
          makeId: item.make,
          modelId: item.model,
        })), {
          validate: true,
          ignoreDuplicates: true
        });

        insertedRows = insertedItems.length;

        const itemCompanyMappings = [];
        for (const item of insertedItems) {
          const originalItem = validItems.find(i => i.itemCode === item.itemCode);
          if (originalItem?.companyIds?.length) {
            for (const companyId of originalItem.companyIds) {
              itemCompanyMappings.push({
                itemId: item.id,
                companyId: companyId
              });
            }
          }
        }

        if (itemCompanyMappings.length > 0) {
          await ItemCompanyMap.bulkCreate(itemCompanyMappings);
        }
      }
    }

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
      });
    } else {
      console.log('Unknown Error:', error);
    }
    throw error
  }
      return { totalRows, insertedRows };

};

const insertLaborSchedule = async (data, userId) => {
  const items = data.slice(1).map((row) => {
    const [
      labourCode, labourDescription, hsnCode, taxPercentage, standard_man_hrs_value, aa, ab, ac, ad, ae, ba, bb, bc, bd, be, ca, cb, cc, cd, ce, da, db, dc, dd, de, category_id, subcategory_id, parts_mapping,
      stdhrsA, stdhrsB, stdhrsC, stdhrsD,
      stdhrsE, citySegmentA, citySegmentB, citySegmentC, citySegmentD,
      osl, companyName

    ] = row;

    let laborCode = labourCode;
    let laborDescription = labourDescription;
    let sacCode = hsnCode;
    let standard_man_hrs = standard_man_hrs_value;



    return {
      laborCode,
      laborDescription,
      sacCode,
      taxPercentage,
      standard_man_hrs,
      stdhrsA,
      stdhrsB,
      stdhrsC,
      stdhrsD,
      stdhrsE,
      citySegmentA,
      citySegmentB,
      citySegmentC,
      citySegmentD,
      osl,
      status: 1,
      createdBy: userId,
      companyName,
      aa, ab, ac, ad, ae, ba, bb, bc, bd, be, ca, cb, cc, cd, ce, da, db, dc, dd, de, category_id, subcategory_id, parts_mapping
    };
  });


  const totalRows = items.length;
  let insertedRows = 0;

  try {
    const existingItems = await LaborSchedule.findAll({
      where: {
        laborCode: items.map(item => item.laborCode)
      },
      attributes: ['laborCode']
    });

    const existingItemCodes = existingItems.map(item => item.laborCode);
    const newItems = items.filter(item => !existingItemCodes.includes(item.laborCode));

    if (newItems.length > 0) {
      const companyNames = items.flatMap(item => {
        return item.companyName.split(',').map(name => name.trim());
      });

      const existingCompany = await Comapanies.findAll({
        // where: {
        //   name: items.map(item => item.companyName)
        // },

        where: { name: companyNames },
        attributes: ['name', 'id']
      });
      const companies = {};
      existingCompany.forEach(item => {
        companies[item.name] = item.id;
      });

      const newCompanies = newItems.filter(item => !companies.hasOwnProperty(item.newModel));
      let insertedCompanies = [];
      // if (newCompanies.length > 0) {
      //   insertedCompanies = await Comapanies.bulkCreate(
      //     newCompanies.filter(item => item.companyName).map(item => ({
      //       code: item.companyName,
      //       name: item.companyName,
      //       status: 1,
      //       image: "bulkTest",
      //       createdBy: userId
      //     })),
      //     { validate: true, ignoreDuplicates: true }
      //   );
      //   insertedCompanies
      //     .filter(group => group.id !== null)
      //     .forEach(group => {
      //       companies[group.name] = group.id;
      //     });
      //   console.log(`${insertedCompanies.length} new Companies created successfully.`);
      // };

      // newItems.forEach(item => {
      //   item.companyName = companies[item.companyName] || item.companyName;
      // });

      const normalizedCompanies = Object.keys(companies).reduce((acc, key) => {
        acc[key.toLowerCase()] = companies[key];
        return acc;
      }, {});

      // newItems.forEach(item => {
      //   const normalizedCompanyName = item.companyName.toLowerCase();
      //   item.companyName = normalizedCompanies[normalizedCompanyName] || item.companyName;
      // });

      newItems.forEach(item => {
        const companyNames = item.companyName.split(',').map(name => name.trim().toLowerCase());
        const normalizedIds = companyNames.map(companyName => {
          return normalizedCompanies[companyName] || null; // companyName
        });
        item.companyName = normalizedIds.join(',');
      });

      const insertedLabors = await LaborSchedule.bulkCreate(newItems, {
        validate: true,
        ignoreDuplicates: true,
      });

      insertedRows = insertedLabors.length;
      // console.log(`${newItems.length} Labor Schedule inserted successfully.`);

      for (let comp of items) {
        for (const item of insertedLabors) {
          if (comp.laborCode === item.laborCode) {
            let companyIds = [];
            if (typeof comp.companyName === 'string' && comp.companyName.includes(',')) {
              companyIds = comp.companyName.split(',');
            } else if (comp.companyName) {
              companyIds = [comp.companyName];
            }

            for (let companyId of companyIds) {
              const companyName = Object.keys(companies).find(key => companies[key] === Number(companyId))
              await LaborCompanyMaps.create({
                laborId: item.id,
                companyId: companyId,
                name: companyName
              });
            }
          }
        }
      }

    } else {
      console.log('No new labors to insert.');
    }

    return { totalRows, insertedRows };
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
      });
    } else {
      console.log('Unknown Error:', error);
    }
    return { totalRows, insertedRows };
  }
};

const insertMake = async (data, userId) => {
  const items = data.slice(1).map((row) => {
    const [
      makeName, makeDescription, companyName
    ] = row;

    return {
      makeName, makeDescription, companyName, createdBy: userId, status: 1
    }
  });

  const totalRows = items.length;
  let insertedRows = 0;

  try {
    const existingMake = await Make.findAll({
      where: {
        makeName: items.map(item => item.makeName)
      },
      attributes: ['makeName']
    });

    const existingMakeName = existingMake.map(item => item.makeName);
    const newMake = items.filter(item => {
      return (
        !existingMakeName.includes(item.makeName) &&
        item.makeName !== '' && item.makeName !== 'undefined' &&
        item.makeName !== 'null' && item.makeName !== null && item.makeName !== undefined
      )
    });

    if (newMake.length > 0) {
      const companyNames = items.flatMap(item => {
        return item.companyName.split(',').map(name => name.trim());
      });

      const existingCompany = await Comapanies.findAll({
        // where: {
        //   name: items.map(item => item.companyName)
        // },

        where: { name: companyNames },
        attributes: ['name', 'id']
      });

      const companies = {};
      existingCompany.forEach(item => {
        companies[item.name] = item.id;
      });

      // const newCompanies = newMake.filter(item => {
      //   !existingCompany.includes(item.companyName) && 
      //   item.companyName !== '' && item.companyName !== 'undefined' &&
      //   item.companyName !== 'null' && item.companyName !== null && item.companyName !==undefined
      //   return !Object.keys(companies).some(company => company.toLowerCase() === item.companyName.toLowerCase());
      // });

      const newCompanies = newMake.filter(item => {
        const companyNamesToCheck = item.companyName.split(',').map(name => name.trim());
        const existingCompanyNames = existingCompany.map(company => company.name.toLowerCase());

        const noMatchingExistingCompany = companyNamesToCheck.every(companyName =>
          !existingCompanyNames.includes(companyName.toLowerCase())
        );
        const isValidCompanyName = item.companyName !== '' && item.companyName !== 'undefined' &&
          item.companyName !== 'null' && item.companyName !== null && item.companyName !== undefined;
        const noMatchingCompaniesObject = !Object.keys(companies).some(company => company.toLowerCase() === item.companyName.toLowerCase());

        return noMatchingExistingCompany && isValidCompanyName && noMatchingCompaniesObject;
      });

      let insertedCompanies = [];
      // if (newCompanies.length > 0) {
      //   insertedCompanies = await Comapanies.bulkCreate(
      //     newCompanies.filter(item => item.companyName).map(item => ({
      //       code: item.companyName,
      //       name: item.companyName,
      //       status: 1,
      //       image: "bulkMake",
      //       createdBy: userId
      //     })),
      //     { validate: true, ignoreDuplicates: true }
      //   );
      //   insertedCompanies
      //     .filter(group => group.id !== null)
      //     .forEach(group => {
      //       companies[group.name] = group.id;
      //     });
      //   console.log(`${insertedCompanies.length} new Companies created successfully.`);
      // };

      // newMake.forEach(item => {
      //   item.companyName = companies[item.companyName] || item.companyName;
      // });

      const normalizedCompanies = Object.keys(companies).reduce((acc, key) => {
        acc[key.toLowerCase()] = companies[key];
        return acc;
      }, {});

      // newMake.forEach(item => {
      //   const normalizedCompanyName = item.companyName.toLowerCase();
      //   item.companyName = normalizedCompanies[normalizedCompanyName] || item.companyName;
      // });

      newMake.forEach(item => {
        const companyNames = item.companyName.split(',').map(name => name.trim().toLowerCase());
        const normalizedIds = companyNames.map(companyName => {
          return normalizedCompanies[companyName] || null; // companyName
        });
        item.companyName = normalizedIds.join(',');
      });

      const insertedMake = await Make.bulkCreate(newMake, {
        validate: true, ignoreDuplicates: true
      });

      insertedRows = insertedMake.length;
      console.log(`${insertedRows} Makes inserted successfully.`);

      let makeCompanyMapData = [];

      for (let comp of newMake) {
        for (const item of insertedMake) {
          if (comp.makeName === item.makeName) {
            let companyIds = [];
            if (typeof comp.companyName === 'string' && comp.companyName.includes(',')) {
              companyIds = comp.companyName.split(',');
            } else if (comp.companyName) {
              companyIds = [comp.companyName];
            }

            for (let companyId of Object.values(companyIds)) {
              makeCompanyMapData.push({
                makeId: item.id,
                companyId: companyId
              });
            }
          }
        }
      }

      if (makeCompanyMapData.length > 0) {
        await MakeCompanyMaps.bulkCreate(makeCompanyMapData);
        console.log(`${makeCompanyMapData.length} Make-Company mappings inserted successfully.`);
      } else {
        console.log('No Make-Company mappings to insert.');
      }

    } else {
      console.log('No new makes to insert');
    }

    return { totalRows, insertedRows };
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
      });
    } else {
      console.log('Unknown Error:', error);
    }

    return { totalRows, insertedRows };
  }
};

const insertModel = async (data, userId) => {
  const items = data.slice(1).map((row) => {
    const [
      makeId, modelName,
      modelDescription, segment, varient, companyName
    ] = row;

    const varientId = varient;

    return {
      makeId: makeId?.trim().toUpperCase(), modelName: modelName?.trim().toUpperCase(), modelDescription,
      segment,
      //  vehicletypeId: 1, varientId, 
       status: 1,
      createdBy: userId, companyName
    };
  });

  const totalRows = items.length;
  let insertedRows = 0;
  let duplicateModels = [];
  let invalidRecords = [];

  try {
    const existingModel = await Model.findAll({
      where: {
        modelName: items.map(item => item.modelName)
      },
      attributes: ['modelName']
    });

    const existingModelName = existingModel.map(item => item.modelName);
    const newModel = items.filter(item => !existingModelName.includes(item.modelName));
    duplicateModels = items.filter(item => existingModelName.includes(item.modelName));

    if (newModel.length > 0) {
newModel.forEach(item => {
        item.companyName = item.companyName
          ? item.companyName.toString().trim().toLowerCase()
          : "";
      });
     // get unique names 
      const uniqueCompanyNames = [...new Set(
        newModel.flatMap(item => 
          item.companyName.split(',').map(name => name.trim()).filter(name => name !== "")
        )
      )];

      const existingCompanies = await Comapanies.findAll({
        where: { name: uniqueCompanyNames },
        attributes: ['name', 'id']
      });

      const companyMap = {};
      existingCompanies.forEach(company => {
        companyMap[company.name.toLowerCase()] = company.id;
      });

      newModel.forEach(item => {
        const companies = item.companyName.split(',')
          .map(name => name.trim().toLowerCase())
          .filter(name => name in companyMap);
        item.companyIds = companies.map(name => companyMap[name]);
      });

           const uniqueMake = [...new Set(newModel.map(i => i.makeId).filter(Boolean))];
const existingMake = await Make.findAll({
  where: { makeName: uniqueMake },
  attributes: ["id", "makeName"]
});
const makeMap = {};
existingMake.forEach(m => makeMap[m.makeName] = m.id);
const newMakeRecords = uniqueMake
  .filter(code => !makeMap[code])
  .map(code => ({
    makeName: code,
    makeDescription: code,
    status: 1,
    createdBy: userId
  }));


if (newMakeRecords.length > 0) {
  const insertedMake = await Make.bulkCreate(newMakeRecords, {
    validate: true,
    ignoreDuplicates: true
  });

  insertedMake.forEach(m => {
    makeMap[m.makeName] = m.id;
  });
     const makeCompanyMappings = [];
        for (const item of insertedMake) {
          const originalItem = newModel.find(i => i.makeId === item.makeName);
          if (originalItem?.companyIds?.length) {
            for (const companyId of originalItem.companyIds) {
              makeCompanyMappings.push({
                makeId: item.id,
                companyId: companyId,
              });
            }
          }
        }

        if (makeCompanyMappings.length > 0) {
          await MakeCompanyMaps.bulkCreate(makeCompanyMappings);
        }
}
newModel.forEach(item => {
  item.make = makeMap[item.makeId] || null;
});

     
      

     

        const insertedItems = await Model.bulkCreate(newModel.map(item => ({
          ...item,
          makeId: item.make,
          
        })), {
          validate: true,
          ignoreDuplicates: true
        });

        insertedRows = insertedItems.length;

        const itemCompanyMappings = [];
        for (const item of insertedItems) {
          const originalItem = newModel.find(i => i.modelName === item.modelName);
          if (originalItem?.companyIds?.length) {
            for (const companyId of originalItem.companyIds) {
              itemCompanyMappings.push({
                modelId: item.id,
                companyId: companyId,
              });
            }
          }
        }

        if (itemCompanyMappings.length > 0) {
          await ModelCompanyMaps.bulkCreate(itemCompanyMappings);
        }
      
    

}

    return { totalRows, insertedRows, duplicateModels, invalidRecords };
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
        invalidRecords.push(validationError);
      });
    } else {
      console.log('Unknown Error:', error);
    }
    return { totalRows, insertedRows, duplicateModels, invalidRecords };
  }
};

// const insertCustomers = async (data, user) => {
//   const items = data.slice(1).map((row) => {
//     const [
//       customerCode, firstName, lastName, address1, address2, pinCode, mobileNumber,
//       sourceName, sourceTypeName, customerCategory, customerType, billType, emailId, contactPerson,
//       contactPersonNumber, transportName, fleetSize, gstinNumber, gstLink, aadharLink, rcLink,
//       panLink, aadharNumber, rcNumber, panNumber
//     ] = row;

//     return {
//       customerCode, firstName, lastName, address1, address2, pinCode, mobileNumber,
//       sourceName, outletId: user.outlet.id, sourceTypeName, customerCategory, customerType, billType, emailId, contactPerson,
//       contactPersonNumber, transportName, fleetSize, gstinNumber,
//       status: 1, aprrovalStatus: 0, createdBy: user.id, gstLink, aadharLink, rcLink,
//       panLink, aadharNumber, rcNumber, panNumber
//     };
//   });

//   const totalRows = items.length;
//   let insertedRows = 0;
//   let duplicateCustomers = [];
//   let invalidRecords = [];

//   try {
//     const existingCustomers = await Customers.findAll({
//       where: {
//         customerCode: items.map(item => item.customerCode)
//       },
//       attributes: ['customerCode']
//     });

//     const existingCustomerData = existingCustomers.map(item => item.customerCode);
//     const newCustomers = items.filter(item => !existingCustomerData.includes(item.customerCode));
//     duplicateCustomers = items.filter(item => existingCustomerData.includes(item.customerCode));


//     if (newCustomers.length > 0) {
//       // Source
//       const existingSource = await Source.findAll({
//         where: {
//           sourceName: items.map(item => item.sourceId)
//         },
//         attributes: ['sourceName', 'id']
//       });

//       const sourceMap = {};
//       existingSource.forEach(sor => {
//         sourceMap[sor.sourceName] = sor.id;
//       });

//       // const newSource = newCustomers.filter(item => !sourceMap.hasOwnProperty(item.sourceId));
//       // let insertedSource = [];
//       const newSource = newCustomers.filter(item => item.sourceId && !sourceMap.hasOwnProperty(item.sourceId));
//       let insertedSource = [];

//       // if (newSource.length > 0) {
//       //   insertedSource = await Source.bulkCreate(
//       //     newSource.filter(item => item.sourceName).map(item => ({
//       //       sourceName: item.sourceId,
//       //       status: 1,
//       //       createdBy: user.id
//       //     })),
//       //     { validate: true, ignoreDuplicates: true }
//       //   ),

//       if (newSource.length > 0) {
//       insertedSource = await Source.bulkCreate(
//         newSource.map(item => ({
//           sourceName: item.sourceId,
//           status: 1,
//           createdBy: user.id
//         })),
//         { validate: true, ignoreDuplicates: true }
//       );
//           // insertedSource.filter(source => source.id !== null)
//           //   .forEach(source => {
//           //     sourceMap[source.sourceName] = source.id;
//           //   });

//           insertedSource
//     .filter(source => source.id)
//     .forEach(source => {
//       sourceMap[source.sourceName] = source.id;
//     });
//         console.log(`${insertedSource.length} new Sources created successfully`);
//       };

//       newCustomers.forEach(item => {
//         item.sourceId = sourceMap[item.sourceId]
//       });

//       //Source Type
//       const existingSourceType = await SourceType.findAll({
//         where: {
//           sourceTypeName: items.map(item => item.sourceTypeId)
//         },
//         attributes: ['sourceTypeName', 'id']
//       });

//       const sourceTypeMap = {};
//       existingSourceType.forEach(sor => {
//         sourceTypeMap[sor.sourceTypeName] = sor.id;
//       });

//       // const newSourceType = newCustomers.filter(item => !sourceTypeMap.hasOwnProperty(item.sourceTypeId));
//       const newSourceType = newCustomers.filter(item =>
//         item.sourceTypeId && !sourceTypeMap.hasOwnProperty(item.sourceTypeId)
//       );

//       newSourceType.forEach(item => {
//         item.sourceId = sourceMap[item.sourceId] ;
//       });

//       const validSourceTypeRecords = newSourceType
//       .filter(item => item.sourceId && item.sourceTypeId)
//       .map(item => ({
//         sourceId: item.sourceId,
//         sourceTypeName: item.sourceTypeId,
//         status: 1,
//         createdBy: user.id
//       }));

//       console.log('final sourcetype data',validSourceTypeRecords)

//       // let insertedSourceType = [];
//       // if (newSourceType.length > 0) {
//       //   insertedSourceType = await Source.bulkCreate(
//       //     newSourceType.filter(item => item.sourceName).map(item => ({
//       //       sourceId: item.sourceId,
//       //       sourceTypeName: item.sourceTypeId,
//       //       status: 1,
//       //       createdBy: user.id
//       //     })),
//       //     { validate: true, ignoreDuplicates: true }
//       //   ),

//       let insertedSourceType = [];
//       if (validSourceTypeRecords.length > 0) {
//         insertedSourceType = await SourceType.bulkCreate(validSourceTypeRecords, {
//           validate: true,
//           ignoreDuplicates: true
//         });
//           // insertedSourceType.filter(source => source.id !== null)
//           //   .forEach(source => {
//           //     sourceTypeMap[source.sourceName] = source.id;
//           //   });

//             insertedSourceType
//     .filter(source => source.id)
//     .forEach(source => {
//       sourceTypeMap[source.sourceTypeName] = source.id;
//     });

//   console.log(`${insertedSourceType.length} new SourceTypes created successfully`);

//       };

//       newCustomers.forEach(item => {
//         item.sourceTypeId = sourceTypeMap[item.sourceTypeId]

//       });

//       // newCustomers.forEach(item => {
//       //   item.customerCategory = item.customerCategory == 'B2B' ? 1 : 2
//       //   item.customerType = item.customerType == 'Individual' ? 1 : 2
//       //   item.billType = item.billType == 'Cash' ? 1 : 2
//       // });

//       for (const item of items) {
//         const stateAndCity = await PinCode.findAll({
//           where: {
//             Pincode: item.pinCode
//           },
//           attributes: ['District', 'StateName']
//         });

//         item['state'] = stateAndCity[0].dataValues.StateName;
//         item['city'] = stateAndCity[0].dataValues.District;

//         item['firstName'] = db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.firstName}', '${encryptConfig.code}'))`);
//         item['lastName'] = db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.lastName}', '${encryptConfig.code}'))`);
//         item['mobileNumber'] = db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.mobileNumber}', '${encryptConfig.code}'))`);
//         item['emailId'] = db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.emailId}', '${encryptConfig.code}'))`);
//        item['contactPerson'] = item.contactPerson
//         ? db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.contactPerson}', '${encryptConfig.code}'))`)
//         : null;

//       item['contactPersonNumber'] = item.contactPersonNumber
//         ? db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.contactPersonNumber}', '${encryptConfig.code}'))`)
//         : null;



//         let tName = item.transaportName ? item.transaportName : null;
//         item['transaportName'] = tName;
//         let fSize = item.fleetSize ? item.fleetSize : null;
//         item['fleetSize'] = fSize;

//         let gLink = item.gstLink ? item.gstLink : null;
//         item['gstLink'] = gLink;
//         let aLink = item.aadharLink ? item.aadharLink : null;
//         item['aadharLink'] = aLink;

//         let rLink = item.rcLink ? item.rcLink : null;
//         item['rcLink'] = rLink;
//         let pLink = item.panLink ? item.panLink : null;
//         item['panLink'] = pLink;

//         let aNumber = item.aadharNumber ? item.aadharNumber : null;
//         item['aadharNumber'] = aNumber;
//         let rNumber = item.rcNumber ? item.rcNumber : null;
//         item['rcNumber'] = rNumber;

//         let pNumber = item.panNumber ? item.panNumber : null;
//         item['panNumber'] = pNumber;
//       };

//       const insertedCustomers = await Customers.bulkCreate(newCustomers, {
//         validate: true, ignoreDuplicates: true
//       });

//       insertedRows = insertedCustomers.length;
//       console.log(`${insertedRows} Customers inserted successfully`);
//     };

//     return { totalRows, insertedRows, duplicateCustomers, invalidRecords };
//   } catch (error) {
//     if (error.name === 'SequelizeValidationError') {
//       console.log('Validation Errors:', error);
//       error.errors.forEach((validationError) => {
//         console.log(`${validationError.path}: ${validationError.message}`);
//         invalidRecords.push(validationError);
//       });
//     } else {
//       console.log('Unknown Error:', error);
//     }
//     return { totalRows, insertedRows, duplicateCustomers, invalidRecords };
//   }
// };


const insertCustomers = async (data, user) => {
  const items = data.slice(1).map((row) => {

  let customerCategory = row[10];

  let finalCustomerCategory;
  if (customerCategory == null || String(customerCategory).trim() === "") {
    finalCustomerCategory = "B2C";
  } else {
    finalCustomerCategory = String(customerCategory).trim();
  }

  return {
    customerCode: row[0] ? row[0].toString().trim() : null,
    firstName: row[1],
    lastName: row[2],
    address1: row[3],
    address2: row[4],
    pinCode: row[5],
    mobileNumber: row[6],
    sourceName: row[7],
    sourceTypeName: row[8],
    customerType: row[9],
    customerCategory: finalCustomerCategory,
    billType: row[11],
    emailId: row[12],
    contactPerson: row[13],
    contactPersonNumber: row[14],
    transportName: row[15],
    fleetSize: row[16],
    gstinNumber: row[17],
    gstLink: row[18],
    aadharLink: row[19],
    rcLink: row[20],
    panLink: row[21],
    aadharNumber: row[22],
    rcNumber: row[23],
    panNumber: row[24],
    branch: row[25],
    is_b2b: row[26],
    oracleCustomerCode: row[27],
    siteNumber: row[28],

    status: 1,
    aprrovalStatus: 0,
    createdBy: user.id
  };
});
  const totalRows = items.length;
  let insertedRows = 0;
  let duplicateCustomers = [];
  let invalidRecords = [];

  try {
    // Find existing customers
    const existingCustomers = await Customers.findAll({
      where: { customerCode: items.map(item => item.customerCode) },
      attributes: ['customerCode']
    });

    const existingCustomerCodes = existingCustomers.map(c => c.customerCode);
    const newCustomers = items.filter(item => !existingCustomerCodes.includes(item.customerCode));
    duplicateCustomers = items.filter(item => existingCustomerCodes.includes(item.customerCode));
    if (newCustomers.length > 0) {

        const outletCodes = [...new Set(newCustomers.map(item => item.branch).filter(Boolean))];

        const existingOutlets = await Outlet.findAll({
          where: { outletCode: outletCodes },
          attributes: ['id', 'outletCode']
        });

        const outletMap = {};
        existingOutlets.forEach(outlet => {
          outletMap[outlet.outletCode] = outlet.id;
        });

        // SOURCE
      const existingSources = await Source.findAll({
        where: { sourceName: newCustomers.map(item => item.sourceName) },
        attributes: ['sourceName', 'id']
      });

      const sourceMap = {};
      existingSources.forEach(source => {
        sourceMap[source.sourceName] = source.id;
      });

      // const uniqueNewSources = [...new Set(newCustomers
      //   .map(item => item.sourceName)
      //   .filter(name => name && !sourceMap[name]))];

      // let insertedSources = [];
      // if (uniqueNewSources.length > 0) {
      //   insertedSources = await Source.bulkCreate(
      //     uniqueNewSources.map(name => ({
      //       sourceName: name,
      //       status: 1,
      //       createdBy: user.id
      //     })),
      //     { validate: true, ignoreDuplicates: true }
      //   );

      //   insertedSources.forEach(source => {
      //     if (source.id) sourceMap[source.sourceName] = source.id;
      //   });

      //   console.log(`${insertedSources.length} new Sources created`);
      // }

      // Assign sourceId from map
      newCustomers.forEach(item => {
        item.sourceId = sourceMap[item.sourceName] || null;
      });

      newCustomers.forEach(item => {
        item.outletId = outletMap[item.branch];
      });

      // SOURCE TYPE
      const existingSourceTypes = await SourceType.findAll({
        where: { sourceTypeName: newCustomers.map(item => item.sourceTypeName) },
        attributes: ['sourceTypeName', 'id']
      });

      const sourceTypeMap = {};
      existingSourceTypes.forEach(type => {
        sourceTypeMap[type.sourceTypeName] = type.id;
      });

      // const uniqueNewSourceTypes = [...new Set(newCustomers
      //   .map(item => item.sourceTypeName)
      //   .filter(name => name && !sourceTypeMap[name]))];

      // const validSourceTypeRecords = uniqueNewSourceTypes
      //   .map(name => {
      //     const sourceId = newCustomers.find(item => item.sourceTypeName === name)?.sourceId;
      //     return sourceId ? {
      //       sourceId,
      //       sourceTypeName: name,
      //       status: 1,
      //       createdBy: user.id
      //     } : null;
      //   })
      //   .filter(Boolean);

      // let insertedSourceTypes = [];
      // if (validSourceTypeRecords.length > 0) {
      //   insertedSourceTypes = await SourceType.bulkCreate(validSourceTypeRecords, {
      //     validate: true,
      //     ignoreDuplicates: true
      //   });

      //   insertedSourceTypes.forEach(type => {
      //     if (type.id) sourceTypeMap[type.sourceTypeName] = type.id;
      //   });

      //   console.log(`${insertedSourceTypes.length} new SourceTypes created`);
      // }

      // Assign sourceTypeId from map
      newCustomers.forEach(item => {
        item.sourceTypeId = sourceTypeMap[item.sourceTypeName] || null;
      });

      // Get city/state and encrypt sensitive fields
      const allPincodes = [
        ...new Set(
          newCustomers
            .map(item => item.pinCode)
            .filter(p => p != null && String(p).trim() !== "")
        )
      ];

      const pinRecords = await PinCode.findAll({
        where: {
          Pincode: allPincodes
        },
        attributes: ['Pincode', 'District', 'StateName']
      });

      const pinMap = {};

      pinRecords.forEach(pin => {
        pinMap[pin.Pincode] = {
          city: pin.District,
          state: pin.StateName
        };
      });
      for (const item of newCustomers) {
        // const pin = await PinCode.findOne({
        //   where: { Pincode: item.pinCode },
        //   attributes: ['District', 'StateName']
        // });
        if (item.pinCode && pinMap[item.pinCode]) {
          item.state = pinMap[item.pinCode].state;
          item.city = pinMap[item.pinCode].city;
        } else {
          item.state = null;
          item.city = null;
        }
        // item.state = pin?.StateName || null;
        // item.city = pin?.District || null;

        // item.firstName = db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.firstName}', '${encryptConfig.code}'))`);
        const firstNameValue = String(item.firstName);

        item.firstName = db.Sequelize.literal(
          `HEX(AES_ENCRYPT(${JSON.stringify(firstNameValue)}, '${encryptConfig.code}'))`
        );
        // item.lastName = db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.lastName}', '${encryptConfig.code}'))`);
        if (item.lastName == null || String(item.lastName).trim() === "") {
          item.lastName = null;
        } else {
          const value = String(item.lastName);

          item.lastName = db.Sequelize.literal(
            `HEX(AES_ENCRYPT(${JSON.stringify(value)}, '${encryptConfig.code}'))`
          );
        }

        if (item.mobileNumber) {
          const value = String(item.mobileNumber);

          item.mobileNumber = db.Sequelize.literal(
            `HEX(AES_ENCRYPT(${JSON.stringify(value)}, '${encryptConfig.code}'))`
          );
        } else {
          item.mobileNumber = null;
        }

        // item.emailId = item.emailId ? db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.emailId}', '${encryptConfig.code}'))`) : null;
        if (item.emailId) {
  const value = String(item.emailId);

  item.emailId = db.Sequelize.literal(
    `HEX(AES_ENCRYPT(${JSON.stringify(value)}, '${encryptConfig.code}'))`
  );
} else {
  item.emailId = null;
}

        // item.contactPerson = item.contactPerson
        //   ? db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.contactPerson}', '${encryptConfig.code}'))`)
        //   : null;
        if (item.contactPerson) {
  const value = String(item.contactPerson);

  item.contactPerson = db.Sequelize.literal(
    `HEX(AES_ENCRYPT(${JSON.stringify(value)}, '${encryptConfig.code}'))`
  );
} else {
  item.contactPerson = null;
}

        // item.contactPersonNumber = item.contactPersonNumber
        //   ? db.Sequelize.literal(`HEX(AES_ENCRYPT('${item.contactPersonNumber}', '${encryptConfig.code}'))`)
        //   : null;
        if (item.contactPersonNumber) {
  const value = String(item.contactPersonNumber);

  item.contactPersonNumber = db.Sequelize.literal(
    `HEX(AES_ENCRYPT(${JSON.stringify(value)}, '${encryptConfig.code}'))`
  );
} else {
  item.contactPersonNumber = null;
}

        item.transportName = item.transportName || null;
        item.fleetSize = item.fleetSize || null;
        item.gstLink = item.gstLink || null;
        item.aadharLink = item.aadharLink || null;
        item.rcLink = item.rcLink || null;
        item.panLink = item.panLink || null;
        item.aadharNumber = item.aadharNumber || null;
        item.rcNumber = item.rcNumber || null;
        item.panNumber = item.panNumber || null;
        item.oracleCustomerCode = item.oracleCustomerCode || null;
        item.siteNumber = item.siteNumber || null;
      }

      // const validCustomers = newCustomers.filter(
      //   item => item.sourceId && item.sourceTypeId
      // );
      const validCustomers = newCustomers;

      const BATCH_SIZE = 2000;

      for (let i = 0; i < validCustomers.length; i += BATCH_SIZE) {

        const batch = validCustomers.slice(i, i + BATCH_SIZE);

        const insertedCustomers = await Customers.bulkCreate(batch, {
          validate: true,
          ignoreDuplicates: true
        });

        insertedRows += insertedCustomers.length;

        console.log(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted: ${insertedCustomers.length}`
        );

      }
      console.log(`${insertedRows} Customers inserted successfully`);
    }

    return { totalRows, insertedRows, duplicateCustomers, invalidRecords };
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
        invalidRecords.push(validationError);
      });
    } else {
      console.log('Unknown Error:', error);
    }

    return { totalRows, insertedRows, duplicateCustomers, invalidRecords };
  }
};


const insertVehicles = async (data, user) => {

  const items = data
    .slice(1)
    .filter(row => row && row.length > 0)
    .map((row) => {

      return {
        customerId: row[0]
          ? row[0].toString().trim()
          : null,
        registrationNumber: row[1],
        makeId: row[2],
        modelId: row[3],
        variantId: row[4],
        fuelType: row[5],
        odometer: row[6],
        chassisNumber: row[7],
        engineNumber: row[8],
        color: row[9],
        insuranceName: row[10],
        insuranceExpDate: row[11],
        stageNorms: row[12],
        axle: row[13],
        application: row[14],
        nextDueDateFC: row[15],
        engineOilCapacity: row[16],
        vehicle_used_by: row[17],
        contact_number: row[18],
        city: row[19],
        pincode: row[20]
          ? row[20].toString().trim()
          : null,
        last_service_date: row[21],
        last_service_km: row[22],
        motor_number: row[23],
        mcu: row[24],
        battery_no_1: row[25],
        battery_no_2: row[26],
        charger_no: row[27],
        imei: row[28],
        colour_code: row[29],
        insurance_policy_no: row[30],
        membership_number: row[31],
        rsa_start_date: row[32],
        rsa_end_date: row[33],
        certificate_url: row[34],
        status: 1,
        createdBy: user.id,
        driverMobileNumber: null,
        driverName: null,
        warrantyStatus: null
      };
    });


  const totalRows = items.length;
  let insertedRows = 0;
  let duplicateVehicles = [];
  let invalidRecords = [];

const normalizeDateToString = (value) => {
  try {

    if (!value) return null;

    // If array → take first value
    if (Array.isArray(value)) {
      value = value[0];
    }

    // If object like { text: '12/03/2026' }
    if (typeof value === 'object') {
      if (value.text) {
        value = value.text;
      } else {
        return null;
      }
    }

    // Excel serial number
    if (typeof value === 'number') {
      const d = new Date(
        Math.round((value - 25569) * 86400 * 1000)
      );
      return d.toISOString().split('T')[0];
    }

    // If already Date
    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString().split('T')[0];
    }

    // If string dd/mm/yyyy
    if (typeof value === 'string') {

      const parts = value.split('/');

      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);

        if (!day || !month || !year) return null;

        const d = new Date(year, month - 1, day);

        return d.toISOString().split('T')[0];
      }

      const parsed = new Date(value);

      if (!isNaN(parsed)) {
        return parsed.toISOString().split('T')[0];
      }
    }

    return null;

  } catch (err) {
    return null;
  }
};
const normalize = (val) => {
  if (!val) return null;
  return val.toString().trim().toUpperCase();
};

  try {
    const existingVehicles = await Vehicles.findAll({
      where: {
        registrationNumber: items.map(item => item.registrationNumber)
      },
      attributes: ['customerId', 'registrationNumber', 'id']
    });

    const existingVehicleData = existingVehicles.map(item => item.registrationNumber);
    const newVehicles = items.filter(item => !existingVehicleData.includes(item.registrationNumber));
    const duplicateVehicles = items.filter(item => existingVehicleData.includes(item.registrationNumber));
    // console.log('wwwwwwwwwwwwwwwwwww',newVehicles)
    // console.log('2222222222222',duplicateVehicles)

    if (newVehicles.length > 0) {
      //Customer
      const existingCustomer = await Customers.findAll({
        where: {
          customerCode: items.map(item => item.customerId)
        },
        attributes: ['customerCode', 'id']
      });

      const customerMap = {};
      existingCustomer.forEach(cust => {
        customerMap[cust.customerCode] = cust.id;
      });



      // const newCustomer = newVehicles.filter(item => !customerMap.hasOwnProperty(item.customerId));
      // let insertedCustomer = [];
      // if (newCustomer.length > 0) {
      //   insertedCustomer = await Make.bulkCreate(
      //     newCustomer.filter(item => item.makeId).map(item => ({
      //       makeName: item.makeId,
      //       makeDescription: "Bulk",
      //       status: 1,
      //       createdBy: user.id
      //     })),
      //     { validate: true, ignoreDuplicates: true }
      //   );
      //   insertedCustomer
      //     .filter(make => make.id !== null)
      //     .forEach(make => {
      //       customerMap[make.makeName] = make.id;
      //     });
      //   console.log(`${insertedCustomer.length} new Customers created successfully.`);
      // }

      newVehicles.forEach(item => {
        item.customerId = customerMap[item.customerId] || null;
      });
      // Make
      const existingMake = await Make.findAll({
        where: {
          makeName: items.map(item => item.makeId)
        },
        attributes: ['makeName', 'id']
      });

      const makeMap = {};

      existingMake.forEach(make => {
        makeMap[normalize(make.makeName)]  = make.id;
      });

      newVehicles.forEach(item => {
        item.makeId = makeMap[normalize(item.makeId)]|| null;
      });
      // Model
      const existingModel = await Model.findAll({
        where: {
          modelName: items.map(item => item.modelId)
        },
        attributes: ['modelName', 'id']
      });
      const modelMap = {};
      existingModel.forEach(model => {
        modelMap[normalize(model.modelName)] = model.id;
      });

      newVehicles.forEach(item => {
        item.modelId = modelMap[normalize(item.modelId)] || null;
      });

      const existingVarient = await Varient.findAll({
        where: {
          varientName: items.map(item => item.variantId)
        },
        attributes: ['varientName', 'id']
      });

      const varientMap = {};
      existingVarient.forEach(varient => {
        varientMap[normalize(varient.varientName)] = varient.id;
      });


      newVehicles.forEach(item => {
      item.variantId = varientMap[normalize(item.variantId)] || null;
    });
      for (const item of items) {

        let fType = item.fuelType ? item.fuelType : null;
        item['fuelType'] = fType;
        let odo = item.odometer ? item.odometer : null;
        item['odometer'] = odo;

        let cNumber = item.chassisNumber ? item.chassisNumber : null;
        item['chassisNumber'] = cNumber;
        let eNumber = item.engineNumber ? item.engineNumber : null;
        item['engineNumber'] = eNumber;

        let clr = item.color ? item.color : null;
        item['color'] = clr;
        let iName = item.insuranceName ? item.insuranceName : null;
        item['insuranceName'] = iName;

        item.insuranceExpDate = normalizeDateToString(item.insuranceExpDate);
        item.nextDueDateFC = normalizeDateToString(item.nextDueDateFC);
        item.rsa_start_date = normalizeDateToString(item.rsa_start_date);
        item.rsa_end_date = normalizeDateToString(item.rsa_end_date);
        item.last_service_date = normalizeDateToString(item.last_service_date);
        let sNorms = item.stageNorms ? item.stageNorms : null;
        item['stageNorms'] = sNorms;

        let axl = item.axle ? item.axle : null;
        item['axle'] = axl;

        let appl = item.application ? item.application : null;
        item['application'] = appl;
        // let nDueDateFC = item.nextDueDateFC ? item.nextDueDateFC : null;
        // item['nextDueDateFC'] = nDueDateFC;

        let eOilCapacity = item.engineOilCapacity ? item.engineOilCapacity : null;
        item['engineOilCapacity'] = eOilCapacity;

        let membership_number = item.membership_number ? item.membership_number : null;
        item['membership_number'] = membership_number;

        // item.rsa_start_date = parseExcelDate(item.rsa_start_date);
        // item.rsa_end_date = parseExcelDate(item.rsa_end_date);
        let certificate_url = item.certificate_url ? item.certificate_url : null;
        item['certificate_url'] = certificate_url;
      };

      // const insertedVehicles = await Vehicles.bulkCreate(newVehicles, {
      //   validate: true, ignoreDuplicates: true
      // });

      // insertedRows = insertedVehicles.length;
      newVehicles.forEach(item => {
      item.makeId = item.makeId ? item.makeId : null;
      item.modelId = item.modelId ? item.modelId : null;
      item.variantId = item.variantId ? item.variantId : null;
      item.customerId = item.customerId || null;
    });
      const BATCH_SIZE = 2000;

      for (let i = 0; i < newVehicles.length; i += BATCH_SIZE) {

        const batch = newVehicles.slice(i, i + BATCH_SIZE);

        const insertedVehicles = await Vehicles.bulkCreate(batch, {
          validate: true,
          // ignoreDuplicates: true
        });

        insertedRows += insertedVehicles.length;

        console.log(
          `Vehicle Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted: ${insertedVehicles.length}`
        );

      }
      console.log(`${insertedRows} Vehicles inserted successfully`);
    };

    return { totalRows, insertedRows, duplicateVehicles, invalidRecords };
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
        invalidRecords.push(validationError);
      });
    } else {
      console.log('Unknown Error:', error);
    }
    return { totalRows, insertedRows, duplicateVehicles, invalidRecords };
  }
};

const insertPincodes = async (data, user) => {
  const items = data.slice(1).map((row) => {
    const [
      CircleName, RegionName, DivisionName, OfficeName, Pincode, OfficeType, Delivery,
      District, StateName, Latitude, Longitude, cv_cityId, cv_stateId
    ] = row;

    return {
      CircleName, RegionName, DivisionName, OfficeName: OfficeName, Pincode: Pincode, OfficeType, Delivery,
      District: District, StateName: StateName, Latitude, Longitude, cv_cityId: cv_cityId === undefined || cv_cityId === null || cv_cityId === '#N/A' ? 0 : cv_cityId,
      cv_stateId: cv_stateId === undefined || cv_stateId === null || cv_stateId === '#N/A' ? 0 : cv_stateId, createdBy: user
    };
  });

  const totalRows = items.length;
  let insertedRows = 0;

  try {

    const newPincode = items.filter(item => {
      return (
        item.Pincode !== undefined && item.Pincode !== null &&
        item.Pincode !== 'null' && item.Pincode !== 'undefined' && item.Pincode !== ''
      );
    });

    const insertedPincode = await PinCode.bulkCreate(newPincode, {
      validate: true, ignoreDuplicates: true
    });

    insertedRows = insertedPincode.length;
    console.log(`${insertedRows} Pincodes inserted successfully.`);

    return { totalRows, insertedRows };

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error);
      error.errors.forEach((validationError) => {
        console.log(`${validationError.path}: ${validationError.message}`);
      });
    } else {
      console.log('Unknown Error:', error);
    }
    return { totalRows, insertedRows };
  }
}

// const insertOutlets = async (data, userId) => {
//   const rows = data.slice(1);

//   const outlets = rows.map((row) => {
//     // console.log('row---------------',row);

//     if (!row || row.length === 0) return null;

//     const [
//       outletCode,
//       outletName,
//       oracleSiteCode,
//       oracleCashCustomerCode,
//       oracleLocation,
//       gstIn,
//       outletSegment,
//       companyId,
//       companyName,
//       email,
//       phoneNumber,
//       address1,
//       address2,
//       pincode,        
//       stateExcel,    
//       cityExcel,     
//       contactPerson,
//       contactEmail,
//       contactPhoneNumber,
//       latitude,
//       longitude,
//       bridgeId,
//       googleRatingLink,
//       bankName,
//       bankAccount,
//       typeofAccount,
//       excelBranch,
//       micrCode,
//       ifscCode,
//       excelStatus,
//       excelMaxPartDiscountPercentage,
//       excelMaxLabourDiscountPercentage,
//       excelCreatedBy,
//       excelUpdatedBy,
//       excelCreatedAt,
//       excelUpdatedAt,
//       mytvs_erp_cust_code


//     ] = row;

//     const now = new Date();

//     return {
//       outletCode: outletCode?.toString().trim(),
//       outletName,
//       oracleSiteCode,
//       oracleCashCustomerCode,
//       oracleLocation,
//       gstIn,
//       outletSegment,
//       companyId,
//       companyName,
//       email,
//       phoneNumber,
//       address1,
//       address2,
//       pincode: pincode?.toString().trim(), 
//       state: null,  
//       city: null,   
//       contactPerson,
//       contactEmail,
//       contactPhoneNumber,
//       latitude,
//       longitude,
//       bridgeId,
//       googleRatingLink,
//       bankName,
//       bankAccount,
//       typeofAccount,
//       branch:null,
//       micrCode:micrCode?.toString().trim(),
//       ifscCode:ifscCode?.toString().trim(),
//       status: 1,
//       maxPartDiscountPercentage: 0,
//       maxLabourDiscountPercentage: 0,
//       createdBy: userId,
//       updatedBy: userId,
//       createdAt: now,
//       updatedAt: now,
//       mytvs_erp_cust_code: mytvs_erp_cust_code
//     };
//   }).filter(Boolean);

//   // console.log('outlets------------',mytvs_erp_cust_code);
//   const totalRows = outlets.length;
//   let insertedRows = 0;

//   // Keep valid outlet code rows
//   const validOutlets = outlets.filter(o =>
//     o.outletCode &&
//     o.outletCode !== "undefined" &&
//     o.outletCode !== "null"
//   );

//   try {
//     // Get existing outlet codes
//     const existing = await Outlet.findAll({
//       where: {
//         outletCode: validOutlets.map(o => o.outletCode)
//       },
//       attributes: ["outletCode"]
//     });

//     const existingCodes = existing.map(o => o.outletCode);
// // console.log('existingCodes--------------------',existingCodes);
//     // New rows = not duplicates
//     const newOutlets = validOutlets.filter(
//       o => !existingCodes.includes(o.outletCode)
//     );
//     // console.log('newOutlets--------------------',newOutlets);

//     if (newOutlets.length > 0) {

//       //  Fetch all pincodes at once
//       const uniquePins = [...new Set(newOutlets.map(o => o.pincode))];

//       const pinRecords = await PinCode.findAll({
//         where: { Pincode: uniquePins },
//         attributes: ["Pincode", "District", "StateName"]
//       });

//       // console.log('pinRecords-------------',pinRecords);


//       const pinMap = {};
//       pinRecords.forEach(p => {
//         pinMap[p.Pincode] = {
//           state: p.StateName,      
//           city: p.District        
//         };
//       });

//       // console.log('pinMap-------------',pinMap);
//       // Replace State + City based on pincode
//       const cleaned = newOutlets
//         .map(o => {
//           const pin = pinMap[o.pincode];

//           if (!pin) return null; 

//           return {
//             ...o,
//             state: pin.state,
//             city: pin.city,
//             mytvs_erp_cust_code : o.mytvs_erp_cust_code
//           };
//         })
//         .filter(o => o !== null);

//         console.log('cleaned-------------',cleaned);

//       // Validate NOT NULL fields
//       const finalList = cleaned.filter(o =>
//         o.outletCode &&
//         o.outletName &&
//         o.gstIn &&
//         o.outletSegment &&
//         o.companyId &&
//         o.email &&
//         o.phoneNumber &&
//         o.address1 &&
//         o.pincode &&
//         o.state &&   
//         o.city 
//       );

//       console.log('finalList-------------',finalList);

//       if (finalList.length > 0) {
//         const inserted = await Outlet.bulkCreate(finalList, {
//           validate: true
//         });

//         insertedRows = inserted.length;
//       }
//     }

//     return { totalRows, insertedRows };

//   } catch (error) {
//     console.log("Error inserting outlets:", error);
//     return { totalRows, insertedRows };
//   }
// };


const insertOutlets = async (data, userId) => {

  const rows = data.slice(1);
  const now = new Date();

  const outlets = rows.map((row) => {

    if (!row || row.length === 0) return null;

    const outlet = {
      outletCode: row[0]?.toString().trim(),
      outletName: row[1],
      oracleSiteCode: row[2],
      oracleCashCustomerCode: row[3],
      oracleLocation: row[4],
      gstIn: row[5],
      outletSegment: row[6],
      companyId: row[7],
      companyName: row[8],
      email: row[9],
      phoneNumber: row[10],
      address1: row[11],
      address2: row[12],
      pincode: row[13]?.toString().trim(),
      state: null,
      city: null,
      contactPerson: row[16],
      contactEmail: row[17],
      contactPhoneNumber: row[18],
      latitude: row[19],
      longitude: row[20],
      bridgeId: row[21],
      googleRatingLink: row[22],
      bankName: row[23],
      bankAccount: row[24],
      typeofAccount: row[25],
      branch: null,
      micrCode: row[27]?.toString().trim(),
      ifscCode: row[28]?.toString().trim(),
      mytvs_erp_cust_code: row[29]?.toString().trim(),
      status: 1,
      maxPartDiscountPercentage: 0,
      maxLabourDiscountPercentage: 0,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now
    };

    return outlet;

  }).filter(Boolean);

  const totalRows = outlets.length;
  let insertedRows = 0;

  const validOutlets = outlets.filter(o =>
    o.outletCode &&
    o.outletCode !== "undefined" &&
    o.outletCode !== "null"
  );

  try {

    const existing = await Outlet.findAll({
      where: {
        outletCode: validOutlets.map(o => o.outletCode)
      },
      attributes: ["outletCode"]
    });

    const existingCodes = existing.map(o => o.outletCode);

    const newOutlets = validOutlets.filter(
      o => !existingCodes.includes(o.outletCode)
    );

    if (newOutlets.length > 0) {

      const uniquePins = [...new Set(newOutlets.map(o => o.pincode))];

      const pinRecords = await PinCode.findAll({
        where: { Pincode: uniquePins },
        attributes: ["Pincode", "District", "StateName"]
      });

      const pinMap = {};

      pinRecords.forEach(p => {
        pinMap[p.Pincode] = {
          state: p.StateName,
          city: p.District
        };
      });

      const cleaned = newOutlets
        .map(o => {

          const pin = pinMap[o.pincode];
          if (!pin) return null;

          return {
            ...o,
            state: pin.state,
            city: pin.city
          };

        })
        .filter(Boolean);

      const finalList = cleaned.filter(o =>
        o.outletCode &&
        o.outletName &&
        o.gstIn &&
        o.outletSegment &&
        o.companyId &&
        o.email &&
        o.phoneNumber &&
        o.address1 &&
        o.pincode &&
        o.state &&
        o.city
      );

      console.log('finalList-------------',finalList);

      if (finalList.length > 0) {

        const inserted = await Outlet.bulkCreate(finalList, {
          validate: true
        });

        insertedRows = inserted.length;

      }
    }

    return { totalRows, insertedRows };

  } catch (error) {

    console.log("Error inserting outlets:", error);
    return { totalRows, insertedRows };

  }
};

const insertBulkCashier = async (data) => {
  const employees = data.slice(1).map((row) => {
    const [outletCode, employeeId, password, employeeRoleId, userRoleId,reports] = row;

    const mobileNumber = Math.floor(1000000000 + Math.random() * 9000000000);

    return {
      outletCode,
      employeeName: employeeId,
      employeeCode: employeeId,
      mobileNumber,
      email: null,
      status: 1,
      createdBy: 1,
      reports: reports === 1 || reports === '1' ? 1 : 0,
      password,
      employeeRoleId,
      userRoleId
    };
  });

  const totalRows = employees.length;
  let insertedRows = 0;

  try {
    const outletCodes = [...new Set(employees.map(e => e.outletCode))];
    const existingOutlets = await Outlet.findAll({
      where: { outletCode: outletCodes },
      attributes: ['id', 'outletCode']
    });
    const outletMap = {};
    existingOutlets.forEach(o => outletMap[o.outletCode] = o.id);

    const missingOutlets = outletCodes.filter(code => !outletMap[code]);
    if (missingOutlets.length > 0) {
      throw new Error(`The following outlet codes do not exist: ${missingOutlets.join(', ')}`);
    }

    employees.forEach(e => {
      e.outletId = outletMap[e.outletCode];
    });

    const existingEmployees = await Employee.findAll({
      where: { employeeCode: employees.map(e => e.employeeCode) },
      attributes: ['employeeCode']
    });
    const existingEmployeeCodes = existingEmployees.map(e => e.employeeCode);
    const newEmployees = employees.filter(e => !existingEmployeeCodes.includes(e.employeeCode));

    const employeeRoleIds = [...new Set(newEmployees.map(e => e.employeeRoleId))];
    const userRoleIds = [...new Set(newEmployees.map(e => e.userRoleId))];

    const employeeRoles = await EmployeeRole.findAll({ where: { id: employeeRoleIds } });
    const employeeRoleMap = {};
    employeeRoles.forEach(r => employeeRoleMap[r.id] = r.employeeRole);

    const userRoles = await Roles.findAll({ where: { id: userRoleIds } });
    const userRoleMap = {};
    userRoles.forEach(r => userRoleMap[r.id] = r.roleName);

    for (let emp of newEmployees) {
      const { password, employeeRoleId, userRoleId, ...empWithoutPassword } = emp;

      if (!employeeRoleMap[employeeRoleId]) throw new Error(`Employee Role ID ${employeeRoleId} not found`);
      if (!userRoleMap[userRoleId]) throw new Error(`User Role ID ${userRoleId} not found`);

      const createdEmp = await Employee.create({
        ...empWithoutPassword,
        employeeRoleId
      });
      insertedRows++;
      if (emp.reports === 1) {
      await EmployeeOutletMap.create({
        emp_id: createdEmp.id,
        outlet_id: emp.outletId
      });
    }

      const hashedPassword = bcrypt.hashSync(password?.toString() || '', 10);
      const createdUser = await User.create({
        user_id: createdEmp.employeeName,
        password: hashedPassword,
        mobile_password: hashedPassword,
        employeeId: createdEmp.id,
        status: 1,
        referesh_required: 1,
        createdBy: 'superadmin'
      });

      await UserRoleMap.create({
        userId: createdUser.id,
        roleId: userRoleId,
        role_name: userRoleMap[userRoleId],
        primary_role: 1
      });
    }

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation Errors:', error.errors.map(e => `${e.path}: ${e.message}`));
    } else {
      console.log('Unknown Error:', error);
    }
    throw error;
  }

  return { totalRows, insertedRows };
};

const dao = {
  insertItems,
  insertLaborSchedule,
  insertMake,
  insertModel,
  insertCustomers,
  insertVehicles,
  insertPincodes,
  insertOutlets,
  insertBulkCashier
};

export default dao;

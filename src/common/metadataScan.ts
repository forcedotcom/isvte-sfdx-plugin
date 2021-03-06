
import {
  SfdxError
} from '@salesforce/core';

import alex = require('alex');

import {
  setValue,
  incrementValue,
  getValue,
  addValue
} from './JSONUtilities';

import {
  mdmap
} from './mdmap';

import fs = require('fs-extra');

import xml2js = require('xml2js');


export function inventoryPackage(sourceDir, p, options = {}) {
  let types = p.types;
  let inventory = {};
  let apiVersions = {};
  let componentProperties = {};
  let dependencies = {};
  let language = {};
  let tmp; //just a temp variable for some ugly if magic
  let scanLanguage = options['scanLanguage'] ?  true: false;
  
  if (p.version) {
    apiVersions['mdapi'] = parseFloat(p.version[0]);
  }
  for (var typeIdx in types) {
    let metadataType = types[typeIdx]['name'];
    
    let typeInv = {};

    typeInv['index'] = typeIdx;

  
    //Check for wildcard members
    if (types[typeIdx]['members'].includes('*')) {
      types[typeIdx]['members'] = getMembers(types[typeIdx], sourceDir);
    }
    typeInv['count'] = types[typeIdx]['members'].length;


    switch (String(metadataType)) {
      case 'CustomField':
        //Do per object field counts
        let objectFields = {};

        for (var fieldIdx in types[typeIdx]['members']) {
          let fieldFullName = types[typeIdx]['members'][fieldIdx];
          let object = getNameSpaceAndType(fieldFullName.split(".")[0]);
          let field = getNameSpaceAndType(fieldFullName.split(".")[1]);
          addObjectDependencies(dependencies,[object,field]);
          if (objectFields[object.fullName]) {
            objectFields[object.fullName]['count'] += 1;
          } else {
            objectFields[object.fullName] = {
              'count': 1,
              'objectType': object.type
            };
          }

          //Check field descriptions
          //Only check custom fields or standard fields on custom objects, not standard
          //Never check for namespaced fields
          if (field.namespace == null && ((object.type == 'Standard' && field.type !== 'Standard')|| object.type !== 'Standard')) {
            const objectPath = `${sourceDir}/objects`;
            let objectXml = `${objectPath}/${object.fullName}.object`;
            
            let objectJSON = parseXML(objectXml);
            if (objectJSON['CustomObject'] && objectJSON['CustomObject']['fields']) {
              for (var fieldDef of objectJSON['CustomObject']['fields']) {
                if (fieldDef['fullName'] == field.fullName) {
                  let descExists = fieldDef['description'] ? 1 : 0;
                  setValue(componentProperties,`CustomField.${fieldFullName.replace(/\./g,"->")}.descriptionExists`,descExists);
            
                  if (scanLanguage && (tmp = languageScanMetadataObject(fieldDef))) {
                    setValue(language,`CustomField.${fieldFullName.replace(/\./g,"->")}`,tmp);
                  }
                }

              }
            }
          }
        }
        typeInv['objects'] = objectFields;

        break;
      case 'CustomObject':
        // Look for Custom Settings, External Objects,  Person Accounts, Big Objects
        const objectPath = `${sourceDir}/objects`;
        let xoCount = 0;
        let boCount = 0;
        let csType = {
          count: 0
        };
        let peType = {
          count: 0
        };
        let fmType = {
          count: 0
        };
        for (var objIdx in types[typeIdx]['members']) {
          let object = getNameSpaceAndType(types[typeIdx]['members'][objIdx]);
          addObjectDependencies(dependencies,[object]);
          //Check external Objects
          if (object.extension == 'e') {
            xoCount += 1;
          }
          //Check Big Objects
          if (object.extension == 'Big Object') {
            boCount += 1;
          }

          //Check Platform Events
          if (object.extension == 'e') {
            peType['count'] += 1;
          }

          //Check Feature Management Parameters
          if (String(object.fullName).includes('FeatureParameter')) {
            fmType['count'] += 1;
          }

          let objectXml = `${objectPath}/${object.fullName}.object`;
          let objectJSON = parseXML(objectXml);
          //Dive Deeper
          if (objectJSON['CustomObject']) {
            //Check Custom Settings
            if (objectJSON['CustomObject']['customSettingsType']) {
              csType['count'] + 1;
            }

            //Check for Descriptions
          if (object.type == 'Custom' && object.namespace == null) {
            let descExists = getValue(objectJSON,'CustomObject.description',null) ? 1 : 0;
            setValue(componentProperties,`CustomObject.${object.fullName}.descriptionExists`,descExists);

          }

          //LanguageScan
          
          if (scanLanguage && (tmp = languageScanMetadataObject(objectJSON))) {
            setValue(language,`CustomObject.${object.fullName}`,tmp);
          }
        
          }
          
          
         
        }
        typeInv['BigObject'] = boCount;
        typeInv['ExternalObject'] = xoCount;
        inventory['CustomSetting__c'] = csType;
        inventory['PlatformEvent__c'] = peType;
        inventory['FeatureManagement__c'] = fmType;

        break;
      case 'PlatformEventChannel':
        //Look for ChangeDataEvents
        break;
      case 'Flow':
        let templateCount = 0;
        let objects = {};
        let flowTypes = {};
        let flowTemplates = {};
        const flowPath = `${sourceDir}/flows`;
        for (var flowIdx in types[typeIdx]['members']) {
          let flowName = types[typeIdx]['members'][flowIdx];
          let flowXml = `${flowPath}/${flowName}.flow`;
          let flowJSON = parseXML(flowXml);
          let processType = getValue(flowJSON,'Flow.processType','UnknownType');
          incrementValue(flowTypes,`${processType}.count`);
          if (getValue(flowJSON,'Flow.isTemplate.0',false)) {
            templateCount += 1;
            incrementValue(flowTemplates,`${processType}.count`);
          }
          //Language Scan
          if (scanLanguage && (tmp = languageScanMetadataObject(flowJSON))) {
            setValue(language, `Flow.${flowName}`,tmp);
          }
          addObjectDependencies(dependencies, extractObjectsApex(JSON.stringify(flowJSON)));

          //Do per object Inventory
          let processMetadataValues;
          if (processMetadataValues = getValue(flowJSON,'Flow.processMetadataValues',null)) {
              for (var processMetadataValue of processMetadataValues) {
                if (processMetadataValue['name'] == 'ObjectType') {
                  let objectName = processMetadataValue['value'][0]['stringValue'][0];
                  let object = getNameSpaceAndType(objectName);
                  addObjectDependencies(dependencies,[object]);
                  incrementValue(objects,`${objectName}.count`);
                }
              }
            }
            
          
        }
        typeInv['FlowTypes'] = flowTypes;
        typeInv['FlowTemplates'] = flowTemplates;
        typeInv['FlowTemplate'] = templateCount;
        typeInv['objects'] = objects;
        break;
      case 'CustomApplication':
        let lightningCount = 0;
        let classicCount = 0;
        let lightingConsoleCount = 0;
        let classicConsoleCount = 0;
        for (var appIdx in types[typeIdx]['members']) {
          let appName = types[typeIdx]['members'][appIdx];
          let uiType;
          let navType;
          const appPath = `${sourceDir}/applications`;
          let appXml = `${appPath}/${appName}.app`;
          let appJSON = parseXML(appXml);
          if (appJSON['CustomApplication']) {
            if (appJSON['CustomApplication']['uiType']) {
              uiType = appJSON['CustomApplication']['uiType'][0];
            }
            if (appJSON['CustomApplication']['navType']) {
              navType = appJSON['CustomApplication']['navType'][0];
            }
            if (uiType === 'Lightning') {
              lightningCount += 1;
              if (navType === 'Console') {
                lightingConsoleCount += 1;
              }
            } else if (uiType === 'Aloha') {
              classicCount += 1;
              if (navType === 'Console') {
                classicConsoleCount += 1;
              }
            }
          }
        }
        typeInv['LightingAppCount'] = lightningCount;
        typeInv['LightningConsoleCount'] = lightingConsoleCount;
        typeInv['ClassicAppCount'] = classicCount;
        typeInv['ClassicConsoleCount'] = classicConsoleCount;
        break;
      case 'ConnectedApp':

        let canvasCount = 0;

        const caPath = `${sourceDir}/connectedApps`;
        for (var caIdx in types[typeIdx]['members']) {
          let caName = types[typeIdx]['members'][caIdx];
          let caXml = `${caPath}/${caName}.connectedApp`;
          let caJSON = parseXML(caXml);
          if (caJSON['ConnectedApp'] && caJSON['ConnectedApp']['canvasConfig']) {
            canvasCount += 1;
          }
        }
        typeInv['CanvasApp'] = canvasCount;
        break;
      case 'ApexClass':
        let futureCount = 0;
        let testCount = 0;
        let auraEnabledCount = 0;
        let batchCount = 0;
        let schedulableCount = 0;
        let invocableCount = 0;
        let apexRestCount = 0;
        let apexSoapCount = 0;
        let characterCount = 0;


        const apexPath = `${sourceDir}/classes`;
        for (var apxIdx in types[typeIdx]['members']) {
          let className = types[typeIdx]['members'][apxIdx];
          let classFile = `${apexPath}/${className}.cls`;
          if (fs.existsSync(classFile)) {

            let classBody = fs.readFileSync(classFile, 'utf8');
            if (scanLanguage && (tmp = languageScan(classBody))) {
              setValue(language,`ApexClass.${className}`,tmp);
            }
            classBody = stripApexComments(classBody);
            
            const futureReg = /@future/i;
            const auraEnabledReg = /@AuraEnabled/i;
            const invocableReg = /@InvocableMethod|InvocableVariable/i;
            const batchReg = /implements\s+Database\.Batchable/i;
            const scheduleReg = /implements\s+Schedulable/i;
            const restReg = /@RestResource/i;
            const soapReg = /webservice\s+static/i;
            const advFLSSOQLReg = /SECURITY_ENFORCED/i;
            const advFLSStripInaccessible = /Security\.stripInaccessible/i;
          //  const refersGuestSimpleReg = /UserType(?:\(\))?\s*=\s*(['"])Guest\1/ig;
          //  const refersGuestComplexReg = /(\w+)\s*=.*getUserType\(\)(?:.*)\1\s*=\s*(["'])Guest\2/is;
            const refersGuestTrivialReg = /(["'])Guest\1/i;
           
            
            if (futureReg.test(classBody)) {
              futureCount += 1;
            }
            if (auraEnabledReg.test(classBody)) {
              auraEnabledCount += 1;
            }
            if (invocableReg.test(classBody)) {
              invocableCount += 1;
            }
            if (restReg.test(classBody)) {
              apexRestCount += 1;
            }
            if (soapReg.test(classBody)) {
              apexSoapCount += 1;
            }
            if (scheduleReg.test(classBody)) {
              schedulableCount += 1;
            }
            if (batchReg.test(classBody)) {
              batchCount += 1;
            }
            if (advFLSSOQLReg.test(classBody)) {
              setValue(componentProperties,`ApexClass.${className}.SECURITY_ENFORCED`,1);
            }
            if (advFLSStripInaccessible.test(classBody)) {
              setValue(componentProperties,`ApexClass.${className}.StripInaccessible`,1);
            }
            if (isTestClass(classBody)) {
              testCount += 1;
            }
            else {
              //Count Apex Characters
              let tmpCharCount = countApexCharacters(classBody);
              characterCount += tmpCharCount;
              addValue(componentProperties,`ApexClass.${className}.CharacterCount`,tmpCharCount);
            }

            if (refersGuestTrivialReg.test(classBody)) {
              setValue(componentProperties,`ApexClass.${className}.RefersToGuest`,1);
            }
            //Find Object References
            
            addObjectDependencies(dependencies, extractObjectsApex(classBody));
                    
          }

          let classMetaFile = `${apexPath}/${className}.cls-meta.xml`;
          if (fs.existsSync(classMetaFile)) {
            let classMetaJSON = parseXML(classMetaFile);
            if (classMetaJSON['ApexClass'] && classMetaJSON['ApexClass']['apiVersion']) {
      
              setValue(apiVersions,`ApexClass.${className}`,parseFloat(classMetaJSON['ApexClass']['apiVersion'][0]));
           }
          }
        }
        typeInv['FutureCalls'] = futureCount;
        typeInv['AuraEnabledCalls'] = auraEnabledCount;
        typeInv['InvocableCalls'] = invocableCount;
        typeInv['BatchApex'] = batchCount;
        typeInv['SchedulableApex'] = schedulableCount;
        typeInv['ApexRest'] = apexRestCount;
        typeInv['ApexSoap'] = apexSoapCount;
        typeInv['TestClasses'] = testCount;
        typeInv['CharacterCount'] = characterCount;

        break;
      case 'ApexTrigger':
        let triggerInv = {};
        //let asyncTrigger = {'count':0};
        let asyncCount = 0;
        let triggerCharacterCount = 0;
        const triggerPath = `${sourceDir}/triggers`;
        for (var triggerIdx in types[typeIdx]['members']) {
          let triggerName = types[typeIdx]['members'][triggerIdx];
          let triggerFile = `${triggerPath}/${triggerName}.trigger`;
          let triggerBody = fs.readFileSync(triggerFile, 'utf8');
          if (scanLanguage && (tmp = languageScan(triggerBody))) {
            setValue(language,`ApexTrigger.${triggerName}`,tmp);
          }
          
          triggerBody = stripApexComments(triggerBody);
          const triggerDetailReg = /trigger\s+(\w+)\s+on\s+(\w+)\s*\((.+)\)/im;
          const refersGuestTrivialReg = /(["'])Guest\1/ig;
         
          let triggerDetail = triggerDetailReg.exec(triggerBody);
          if (triggerDetail !== null) {
            let triggerObject = getNameSpaceAndType(triggerDetail[2]);
         // let triggerType = triggerDetail[3];
            //Add Namespace Dependencies 
            addObjectDependencies(dependencies,[triggerObject]);
            if (triggerObject.type == 'Change Data Capture') {
              asyncCount += 1;
            }
            incrementValue(triggerInv,`${triggerObject.fullName}.count`);
            
            if (refersGuestTrivialReg.test(triggerBody)) {
              setValue(componentProperties,`ApexTrigger.${triggerName}.refersToGuest`,1);
            }

            let tmpCharCount = countApexCharacters(triggerBody);
            triggerCharacterCount += tmpCharCount;
            addValue(componentProperties,`ApexTrigger.${triggerName}.CharacterCount`,tmpCharCount);

            //Find Object References
            
            addObjectDependencies(dependencies, extractObjectsApex(triggerBody));
          }

          let triggerMetaFile = `${triggerPath}/${triggerName}.trigger-meta.xml`;
          if (fs.existsSync(triggerMetaFile)) {
            let triggerMetaJSON = parseXML(triggerMetaFile);
            if (triggerMetaJSON['ApexTrigger'] && triggerMetaJSON['ApexTrigger']['apiVersion']) {
              setValue(apiVersions,`ApexTrigger.${triggerName}`,parseFloat(triggerMetaJSON['ApexTrigger']['apiVersion'][0]));
            }
          }
        }
        typeInv['objects'] = triggerInv;
        typeInv['AsyncTrigger'] = asyncCount;
        typeInv['CharacterCount'] = triggerCharacterCount;
        break;
      case 'LightningComponentBundle':
        const lwcPath = `${sourceDir}/lwc`;
        let exposedCount = 0;
        let targets = {}

        for (var lwcIdx in types[typeIdx]['members']) {
          const lwcName = types[typeIdx]['members'][lwcIdx];
          const lwcXml = `${lwcPath}/${lwcName}/${lwcName}.js-meta.xml`;
          const lwcHtmlFile = `${lwcPath}/${lwcName}/${lwcName}.html`;
          const lwcJsFile = `${lwcPath}/${lwcName}/${lwcName}.js`;
          //TODO: Parse for object and namespace references
          let lwcJSON = parseXML(lwcXml);
          if (lwcJSON['LightningComponentBundle']) {
            lwcJSON = lwcJSON['LightningComponentBundle'];

            if (lwcJSON['apiVersion']) {
              setValue(apiVersions,`LightningComponentBundle.${lwcName}`,parseFloat(lwcJSON['apiVersion'][0]));
            }
            if (lwcJSON['isExposed'] && lwcJSON['isExposed'][0] === 'true') {
              exposedCount += 1;
            }
            if (lwcJSON['targets'] && lwcJSON['targets'][0]['target']) {
              for (let target of lwcJSON['targets'][0]['target']) {
                if (targets[target] != undefined) {
                  targets[target] += 1;
                }
                else {
                  targets[target] = 1;
                }
              }
            }
          }
          if (scanLanguage && fs.existsSync(lwcHtmlFile)) {
            const lwcHTML = fs.readFileSync(lwcHtmlFile, 'utf8');

            languageScan(lwcHTML,'html');
          }
          if (scanLanguage && fs.existsSync(lwcJsFile)) {
            languageScan(fs.readFileSync(lwcJsFile, 'utf8'));
          }
        }
        typeInv['ExposedComponents'] = exposedCount;
        typeInv['targets'] = targets;

        break;
      case 'ApexPage':
        const vfPath = `${sourceDir}/pages`;
        for (var vfIdx in types[typeIdx]['members']) {
          const vfName =  types[typeIdx]['members'][vfIdx];
          const vfFile = `${vfPath}/${vfName}.page`;
          const vfXML = `${vfPath}/${vfName}.page-meta.xml`;
          if (fs.existsSync(vfXML)) {
            let vfMetaJSON = parseXML(vfXML);
            if (vfMetaJSON['ApexPage'] && vfMetaJSON['ApexPage']['apiVersion']) {
              setValue(apiVersions,`ApexPage.${vfName}`,parseFloat(vfMetaJSON['ApexPage']['apiVersion'][0]));
            }
          }
          if (fs.existsSync(vfFile)) {
            const vfBody = fs.readFileSync(vfFile, 'utf8');
            const referSiteReg = /{!.*(\$Site|\$Network).*}/ig;
            const stdControllerReg = /standardController="([a-zA-Z0-9_]+)"/i;
            if (scanLanguage && (tmp = languageScan(vfBody,'html'))) {
              setValue(language,`ApexPage.${vfName}`,tmp);
            }
            
            //Find Standard Controllers
            let stdControllerMatch = stdControllerReg.exec(vfBody);

            if (stdControllerMatch !== null) {
              let controllerObject = getNameSpaceAndType(stdControllerMatch[1]);
              addObjectDependencies(dependencies,[controllerObject]);
            }

            //Find namespaces in components used
            const componentsReg = /<(\w+:\w+)/ig;
            let referencedComponents = getMatches(vfBody, componentsReg);
            if (referencedComponents.length > 0) {
              referencedComponents.forEach(element => {
                let ns = element.split(":", 2)[0];
                incrementValue(componentProperties,`ApexPage.${vfName}.namespaceReferences.${ns}`);
                setValue(dependencies,`namespaces.${ns}`,1);
              });
            }

            if (referSiteReg.test(vfBody)) {
              setValue(componentProperties,`ApexPage.${vfName}.RefersToSite`,1);
            }

          }
        }
        break;
      case 'AuraDefinitionBundle':
        const auraPath = `${sourceDir}/aura`;
        for (var auraIdx in types[typeIdx]['members']) {
          const auraName = types[typeIdx]['members'][auraIdx];
          const auraXml = `${auraPath}/${auraName}/${auraName}.cmp-meta.xml`;
          let auraJSON = parseXML(auraXml);
          if (auraJSON['AuraDefinitionBundle'] && auraJSON['AuraDefinitionBundle']['apiVersion']) {
            setValue(apiVersions,`AuraDefinitionBundle.${auraName}`,parseFloat(auraJSON['AuraDefinitionBundle']['apiVersion'][0]));
          }
          //Count Used Components by Namespace
          let auraCmpFile = `${auraPath}/${auraName}/${auraName}.cmp`;
          //TODO: Parse for object references

          if (fs.existsSync(auraCmpFile)) {

            let auraBody = fs.readFileSync(auraCmpFile, 'utf8');
            if (scanLanguage && (tmp = languageScan(auraBody,'html'))) {
              setValue(language,`AuraDefinitionBundle.${auraName}`,tmp);
            }
            
            const componentsReg = /<(\w+:\w+)/ig;
            let referencedComponents = getMatches(auraBody, componentsReg);
            if (referencedComponents.length > 0) {
              referencedComponents.forEach(element => {
                let ns = element.split(":", 2)[0];
                incrementValue(componentProperties,`AuraDefinitionBundle.${auraName}.namespaceReferences.${ns}`);
                //Also add it to the Namespaces dependencies
                setValue(dependencies,`namespaces.${ns}`,1);
              });
            }
            const interfaceReg = /(?:implements|extends)\s*=\s*"([\w ,:]+)"/igm;
            let interfaceMatches = getMatches(auraBody, interfaceReg);
            if (interfaceMatches.length > 0) {
              interfaceMatches.forEach(element => {
                let interfaces = element.split(/ *, */);
                interfaces.forEach(element => {
                  setValue(componentProperties,`AuraDefinitionBundle.${auraName}.interfaces.${element}`,1);
                });
              })
            }
            //Find Object References
            addObjectDependencies(dependencies,extractObjectsApex(auraBody));
          }
        }
        break;
      case 'CustomLabels' :
         const lblJSON = parseXML(`${sourceDir}/labels/CustomLabels.labels`);
        if (scanLanguage && (tmp = languageScanMetadataObject(lblJSON))) {
          setValue(language, `CustomLabels.labels`,tmp);
        }
        
        break;
    }

    inventory[metadataType] = typeInv;
  }
 
  //Check Person Accounts
  let pafile = `${sourceDir}/objects/PersonAccount.object`;
  if (fs.existsSync(pafile)) {
    setValue(dependencies,'features.PersonAccount',1);
  }

  inventory['apiVersions'] = apiVersions;
  inventory['componentProperties'] = componentProperties;
  inventory['dependencies'] = dependencies;
  inventory['language'] = language;
  return inventory;
}

function getMembers(mdTypeDef, sourceDir) {
  let retVal = mdTypeDef['members'];
  if (mdTypeDef.name == 'CustomField') {
    retVal = getFieldMembersFromObjects(sourceDir);
  }
  else if (mdmap[mdTypeDef.name] != undefined) {
     if (mdmap[mdTypeDef.name]['folder'] != 'null' && mdmap[mdTypeDef.name]['extension'] != 'null') {
      retVal = getMembersFromFiles(`${sourceDir}/${mdmap[mdTypeDef.name]['folder']}`, mdmap[mdTypeDef.name]['extension']);
    }
  }
  return retVal;
}

function getFieldMembersFromObjects(sourceDir: String) {
  const members = [];
//Get Wildcard Fields from Object Definitions
const objectPath = `${sourceDir}/objects`;
if (fs.existsSync(objectPath)) {
  const objectDefs = fs.readdirSync(objectPath);
  objectDefs.forEach(element => {

    const [objectName, ext] = [element.substr(0, element.lastIndexOf('.')), element.substr(element.lastIndexOf('.') + 1, element.length)]
    if (ext === 'object') {
      const objectXml = `${objectPath}/${objectName}.object`;
     
      const objectJSON = parseXML(objectXml);
      
      if (objectJSON['CustomObject'] && objectJSON['CustomObject']['fields']) {
        for (var fieldDef of objectJSON['CustomObject']['fields']) {
          members.push(objectName + '.' + fieldDef['fullName']);
        }
      }

    }
  });
}
  return members;
}


function getMembersFromFiles(folder, extension) {
  const typePath = folder;
  const members = [];
  if (!fs.existsSync(typePath)) {
    return members;
  }
  const folderContents = fs.readdirSync(typePath);
  folderContents.forEach(element => {

    const [fileName, ext] = [element.substr(0, element.lastIndexOf('.')), element.substr(element.lastIndexOf('.') + 1, element.length)]
    if (ext === extension) {
      members.push(fileName);
    }
  });

  return members;
}


function extractObjectsApex(apexBody: string)  {
  const findObjectsReg = /(?:(?<namespace>[a-zA-Z](?:[a-z]|[A-Z]|[0-9]|_(?!_)){0,14})__)?(?<component>(?<!___)[a-zA-Z](?:[a-z]|[A-Z]|[0-9]|_(?!_))+)(?:__(?<suffix>c|mdt|e|x|b|pc|pr|r|xo|latitude__s|longitude__s|history|ka|kav|feed|share))/g;
   
  let objectsFound = [];
  let objectFound;
  while (objectFound = findObjectsReg.exec(apexBody)) {
    objectsFound.push(getNameSpaceAndType(objectFound[0]));
  }  
  return objectsFound;      
 }

 function addObjectDependencies(dependencies: Object, objects: Object[]) {
 
    for (const o of objects) {
      if (o['namespace'] !== null) {
        setValue(dependencies,`namespaces.${o['namespace']}`,1);
      }
      setValue(dependencies,`components.${o['fullName']}`,o);
    }
 }



function stripApexComments(apexBody : string) {
  const commentReg = /\/\*[\s\S]*?\*\/|((?<!:)|^)\/\/.*$/gm;
   return apexBody.replace(commentReg,'');
}

function countApexCharacters(apexBody : string, includeTests : boolean = false) {
  let charCount = 0;
   
  if (includeTests === true || (!isTestClass(apexBody))) {
    charCount = apexBody.length;
  }
  return charCount;
}

function isTestClass(apexBody : string) {
  const isTestReg = /@isTest.*\s*.*(private|public|global).*class.*/i;
  return isTestReg.test(apexBody);
}
 

function getMatches(searchString, regex) {
  let matches = [];
  let match;
  while (match = regex.exec(searchString)) {
    matches.push(match[1]);
  }
 // logLine(`Found ${matches.length} matches`);
 // logJSON(matches);
  return matches;
}

function getNameSpaceAndType(fullComponentName) {
  /*
  Parse object or field names
  Cases Covered:
  StandardThing
  StandardThing__ext
  CustomThing__ext
  Namespace_CustomThing__ext
  CustomField__location__s
  Namespace__CustomField__location__s
  */
 // logLine('Breaking down component name:' + fullComponentName);
  
  const retVal = {
    type:null,
    name:null,
    extension:null,
    namespace:null,
    fullName: fullComponentName
  };

  let breakdown = fullComponentName.split("__");
 // logLine('Component Breakdown: ' + JSON.stringify(breakdown));
  if (breakdown.length == 1) {
      //Standard Object
      retVal.type = 'Standard';
      retVal.name = breakdown[0];
  }
  else {
    //Check for and fixup locations
 //   logLine('Proposed Suffix:' + breakdown[breakdown.length -1]);
    if (breakdown[breakdown.length -1] == 's'  && breakdown.length > 2 && (breakdown[breakdown.length-2] == 'latitude' || breakdown[breakdown.length-2] == 'longitude' )) {
   //   logLine('This appears to be a location field with an extra __ in the suffix. Adjusting expectations'); 
        breakdown.pop();
        breakdown[breakdown.length -1] = breakdown[breakdown.length -1] + '__s';
      
    }

    //we have an extension and possibly a namespace
    retVal.extension = breakdown[breakdown.length -1];
    
    if (breakdown.length == 2) {
      //non namespaced custom object
      retVal.name = breakdown[0];
    }
    else if (breakdown.length == 3) {
      retVal.name = breakdown[1];
      retVal.namespace = breakdown[0];
    }
    else {
      //WE probably shouldn't end up here.
  //    logLine('Unsure how to parse ' + fullComponentName);
      retVal.name = fullComponentName;
    }
    switch (retVal.extension) {
      case 'c':
        retVal.type = 'Custom';
        break;
      case 'r':
        retVal.type = 'Relationship';
        break;
      case 'ka':
        retVal.type = 'Knowledge Article';
        break;
      case 'kav':
        retVal.type = 'Knowledge Article Version';
        break;
      case 'feed':
        retVal.type = 'Object Feed';
        break;
      case 'viewstat':
        retVal.type = 'Knowledge Article View Stat';
        break;
      case 'votestat':
        retVal.type = 'Knowledge Article Vote Stat';
        break;
      case 'datacategoryselection':
        retVal.type = 'Knowledge Article Data Category';
        break;
      case 'x':
        retVal.type = 'External Object';
        break;
      case 'xo':
        retVal.type = 'S2S Proxy Object';
        break;
      case 'mdt':
        retVal.type = 'Custom Metadata Type';
        break;
      case 'share':
        retVal.type = 'Custom Object Sharing';
        break;
      case 'tag':
        retVal.type = 'Tag';
        break;
      case 'history':
        retVal.type = 'Field History Tracking';
        break;
      case 'pc':
        retVal.type = 'Person Account';
        break;
      case 'pr':
        retVal.type = 'Person Account Relationship';
        break;
      case 'b':
        retVal.type = 'Big Object';
        break;
      case 'latitude__s':
        retVal.type = 'Geolocation Latitude Coordinate';
        break;
      case 'longitude__s':
        retVal.type = 'Geolocation Longitude Coordinate';
        break;
      case 'e':
        retVal.type = 'Platform Event';
        break;
      case 'p':
        retVal.type = 'Custom Person Object';
        break;
      case 'changeevent':
        retVal.type = 'Change Data Capture';
        break;
      default:
        retVal.type = 'Unknown';
    }

  }
//  logLine('Parsed component: ' + JSON.stringify(retVal));
  return retVal;
}

export function parseXML(xmlfile, dieOnError = false) {
  const parser = new xml2js.Parser({
    attrkey: 'ATTR'
  });
  let json = [];
  let error = undefined;

  if (!fs.existsSync(xmlfile)) {
    let message = `Cannot find XML File: ${xmlfile}`;
    if (dieOnError == true) {
      throw new SfdxError(message, 'XMLNotFoundError');
    } else {
      return json;
    }
  }
  let xmlData = fs.readFileSync(xmlfile, 'utf8');
  parser.parseString(xmlData.substring(0, xmlData.length), function (err, result) {
    error = err;
    json = result || json;
  });

  if (error && dieOnError) {
    throw new SfdxError(`Error parsing ${xmlfile}: ${error}`, 'XMLParseError');
  }
  return json;
}

function isObject(o: any): boolean {
  return (o !== null && typeof o === 'object' && !Array.isArray(o));
}



function languageScanMetadataObject(mdObject: any, ignoreProperties: string[] = []): any {
  let result = [];
  let tmpResult;
  const textyKeysreg = /[d|D]escription|[l|L]abel|[h|H]elp|[t|T]ext|[n|N]ame|[v|V]alue/;
  if (isObject(mdObject)) {
    for (let [key, value] of Object.entries(mdObject)) {
      const isTexty = textyKeysreg.test(key);
      if (isObject(value)) {
        if (tmpResult = languageScanMetadataObject(value)) {
          result.push(...tmpResult);
        }
      }
      else if (Array.isArray(value)) {
        for (const k of value) {
          if (isObject(k)) {
            if (tmpResult = languageScanMetadataObject(k)) {
              result.push(...tmpResult);
            }
          }
          else {
            if (isTexty) {
              if (tmpResult = languageScan(k)) {
                for (let r of tmpResult) {
                  r.context = `Property: ${key} = ${r.context}`;
                }
                result.push(...tmpResult);
              }
            }
          }
        }
      }
      else if (isTexty) {
        if (tmpResult = languageScan(mdObject[key])) {
          for (let r of tmpResult) {
            r.context = `Property: ${key} = ${r.context}`;
          }
          result.push(...tmpResult);
        }
      }

    }
  }
  if (result.length > 0) {
    return result;
  }
  else {
    return false;
  }
}

function languageScan(text: string, type : string = 'text') : any {
  //return immediately if text is empty
  if (!text) {
    return false;
  }
  let scanResult = {};
  let config= {
    "noBinary": true,
    "profanitySureness": 1,
    "allow": ["simple","invalid","special","just","fires","host-hostess","gross","period","executes","execution"]
  };

  switch (type) {
    case 'text':
      scanResult = alex.text(text,config);
    break;
    case 'html':
      scanResult = alex.html(text),config;
    break;
    case 'markdown':
      scanResult = alex(text,config)
    break;
  }
  if (scanResult['messages'].length > 0) {
    let retVal = [];
    let lines = text.split(/\r?\n/);
    for (const result of scanResult['messages']) {
      retVal.push({
        message: result.message,
        details: result.note,
        context: lines[result.line -1],
        ruleName: result.ruleId,
        line: result.line
      })
      
    }
    return retVal;
  }
  else {
    return false;
  }
} 







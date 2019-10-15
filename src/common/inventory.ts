/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { mdTypes, editions, enablementRules, qualityRules, alerts } from './rules';

const editionRules = editions;
//const enablement = enablementRules
const monitoredTypes = mdTypes;
const pushAlertDefs = alerts;
//const qualityRuleDefs = qualityRules;

const packageInventory = {
  _mdInv: {},
  _mdFullInvArray: undefined,
  _mdMonitoredInvArray: undefined,
  _recomendations: [],


  setMetadata: function(md) {
    this._mdInv = md;
  },

 

  getInstallationWarnings: function(){
    
    let warnings = [];
    for (var edition of editionRules) { 
      let editionBlock = [];
      for (var blockingType of edition['blockingItems']) {
        if (this.getInventoryCountByMetadataType(blockingType['metadataType']) > blockingType['threshold'] ) {
          if (blockingType['requiresSR']) {
    //        editionBlock.push(` -${blockingType['label']} count is greater than ${blockingType['threshold']}. Package cannot be installed without Security Review`);
            editionBlock.push({metadataType:blockingType['metadataType'], label: blockingType['label'], requiresSR:blockingType['requiresSR'], threshold: blockingType['threshold'], count:  this.getInventoryCountByMetadataType(blockingType['metadataType'])});
          }
          else {
          //  editionBlock.push(` -${blockingType['label']} count is greater than ${blockingType['threshold']}`);
            editionBlock.push({metadataType:blockingType['metadataType'], label: blockingType['label'], threshold: blockingType['threshold'], count:  this.getInventoryCountByMetadataType(blockingType['metadataType'])});
          }
        }
      }
      if (editionBlock.length > 0) {
      //  warnings.push(`Package cannot be installed in ${edition['name']} due to:`);
      //  warnings.push(editionBlock.join('\n'));
        warnings.push({'edition':edition['name'], blockingItems: editionBlock});
      }
    }
    // if (warnings.length > 0) {
    //   return warnings.join('\n');
    // }
    // else {
    //   return 'Can be installed in any Edition';
    // }
    return warnings;
  },

  getAlerts: function(){
    
    let alerts = [];
    const now = new Date().toJSON();
    for (var alertDef of pushAlertDefs) { 
      if ((alertDef.expiration > now) && this.getInventoryCountByMetadataType(alertDef['metadataType']) > 0) {
        alerts.push(alertDef);
      }  
    }
    return alerts;
  },

  // getRecommendations: function() {
  //   let recomendations = [];
  //   for (var ruleDef of enablement) { 
  //    if (ruleDef['threshold'] !=undefined ) {
  //     let count = this.getInventoryCountByMetadataType(ruleDef['metadataType']);
  //     if (ruleDef['recPos'] && count > ruleDef['threshold']) {
  //       recomendations.push({metadataType:ruleDef.metadataType, label: ruleDef['label'], message:ruleDef['recPos']['message'], url: ruleDef['recPos']['url']});
  //     }
  //     if (ruleDef['recNeg'] && count <= ruleDef['threshold']) {
  //       recomendations.push({metadataType:ruleDef.metadataType, label: ruleDef['label'], message:ruleDef['recNeg']['message'], url: ruleDef['recNeg']['url']});
  //     }
  //    }
  //   }
  //  return recomendations;
  //  },

   getQualityRecommendations() {
 //    console.log(JSON.stringify(this.checkRules(qualityRules)));
     return this.checkRules(qualityRules);
   },

   getEnablementMessages() {
     return this.checkRules(enablementRules)
   },
   
   checkRules(ruleSet) {
     let recomendations = [];
     for (var ruleDef of ruleSet) { 
 //     console.log('Rule: ' + JSON.stringify(ruleDef));

      let counts = this.getCountByMetadataType(ruleDef.metadataType);
  //       console.log('Counts: ' + JSON.stringify(counts));
         if (ruleDef.recNeg) {
           let exceptions = [];
           if (counts.length == 0 && ruleDef.threshold == -1) {
            recomendations.push({metadataType:ruleDef.metadataType, label: ruleDef['label'], message:ruleDef['recNeg']['message'], url: ruleDef['recNeg']['url']});
           }
           else {
           for (var count of counts) {
             if (count.value <= ruleDef.threshold) {
               exceptions.push(count.property);
             }
           }
           if (exceptions.length > 0) {
             recomendations.push({metadataType:ruleDef.metadataType, label: ruleDef['label'], message:ruleDef['recNeg']['message'], 'exceptions': exceptions, url: ruleDef['recNeg']['url']});
           }
          }
         }
         if (ruleDef.recPos) {
           let exceptions = [];
           for (var count of counts) {
             if (count.value > ruleDef.threshold) {
               exceptions.push(count.property);
             }
           }
           if (exceptions.length > 0) {
             recomendations.push({metadataType:ruleDef.metadataType, label: ruleDef['label'], message:ruleDef['recPos']['message'], 'exceptions': exceptions, url: ruleDef['recPos']['url']});
           }
         } 
       }
       return recomendations;
      },

    getCountByMetadataType(metadataType) {
    let mdDefArray = metadataType.split('.');
    let retVal = [];
    let mdCount = this.traverseMetadata(mdDefArray,this._mdInv);
    if (Array.isArray(mdCount)) {
      retVal = mdCount;
    }
    else {
      retVal.push(mdCount);
    }
    return retVal;
  },

  traverseMetadata(mdArray,mdObject,wildcard = '') {
 //  Recurses through mdArray -- a sequential list of properties to navigate down the object, mdObject
 //
 // Check the first element in the array. 
 // If it's a wildcard (*), go through all top level properties of the object calling this function again for each property of the object 
 // If it is not a wildcard, check to see if that value exists as a key of the object.
 // If value exists and there exist more entries in the properties array, recursively call this function with parameters mdArray = (original mdArray with first entry removed), mdObject = mdObject['Property that was removed from mdArray']
 // if value exists and there are no more entries in the array, check to see if the value is a number
 // If it is a number, then return the number and the property name (or the wildcard name)
 // If it is not a number, then check to see if adding .count to the property is a number
    let topLevel = mdArray.shift();
    if (topLevel === '*') {
      let retVal = [];
//      console.log ('Checking Wildcard');
      for (var topArray in mdObject) {
        let tmpArray = [topArray,...mdArray];
       
//        console.log('checking new Array: ' + tmpArray);
//        console.log(`  ParamArray: ${tmpArray}, Wildcard: ${topArray}`);
        retVal.push(this.traverseMetadata(tmpArray,mdObject,topArray));
      }
//      console.log('Wildcard Processed');
      return retVal;
    }
    else if (mdObject[topLevel] != undefined) {
      if (mdArray.length > 0) {
//        console.log('There are more components left. Recursing');
//        console.log(`  ObjectKey: ${topLevel} ParamArray: ${mdArray}, Wildcard: ${wildcard}`);
        return this.traverseMetadata(mdArray,mdObject[topLevel],wildcard);
      }
      else {
//        console.log('This is last portion. Looking for value');
        let count = undefined;
        if (isNaN(mdObject[topLevel])) {
//          console.log(`${mdObject[topLevel]} is not a number. Checking .count`);
          if (mdObject[topLevel]['count'] != undefined && isFinite(mdObject[topLevel]['count'])) {
            count = mdObject[topLevel]['count'];
          }
          else {
//            console.log(' Cannot find a valid number returning empty object');
            return {};
          }
          
        }
        else {
//          console.log('Using value from ' + topLevel);
          count = mdObject[topLevel];
        }
//        console.log('Final Value:' + count);
        let componentName = wildcard == '' ? topLevel : wildcard;
        return {property: componentName, value: count};
      }
      
    }
    else {
 //     console.log(`could not find Key ${topLevel} in the object: ` + JSON.stringify(mdObject));
      return {};
    }
  },
     

  getInventoryCountByMetadataType(metadataType) {
    let mdType = this.parseMetadataType(metadataType);
    let count = 0;
    if (this._mdInv[mdType.metadataType]) {
      if (mdType.key === 'object' && mdType.targetObj) {
        if (this._mdInv[mdType.metadataType]['objects'] && this._mdInv[mdType.metadataType]['objects'][mdType.targetObj]) {
          count = this._mdInv[mdType.metadataType]['objects'][mdType.targetObj]['count'];
        }
      }
      else {
        if (this._mdInv[mdType.metadataType][mdType.key]) {
          count = this._mdInv[mdType.metadataType][mdType.key];
        }
      }
      
    }
    return count;
  },

  parseMetadataType(metadataType) {
    let mdType = metadataType.split('.'); //To look at subtypes, use Type.Subtype (e.g.: ApexClass.BatchApex)
    let key = mdType[1] ? mdType[1] : 'count';
    let parsedType = {'metadataType':mdType[0],'key':key};
    if (key === 'object' && mdType[2]) {
      parsedType['targetObj'] = mdType[2];
    }
    if (mdType[0] === 'apiVersions' && mdType[2]) {
      parsedType['targetComponent'] = mdType[2];
    }
   
    return parsedType;
  },

  getJSONOutput: function() {
    let retVal = {};
    retVal['MetadataInventory'] = this._mdInv;
    retVal['MonitoredItems'] = this.getMonitoredInvArray();
    retVal['Recommendations'] = this.getEnablementMessages();
    retVal['CodeQualityNotes'] = this.getQualityRecommendations();
    retVal['InstallationWarnings']  = this.getInstallationWarnings();
    retVal['Alerts'] = this.getAlerts();
    return retVal;
  },


  getFullInvArray: function() {
    if (!this._mdFullInvArray) {
      this._mdFullInvArray = [];
      for (var mdType in this._mdInv) {
        if (mdType !== 'apiVersions') {
          this._mdFullInvArray.push({"metadataType": mdType, "count": this._mdInv[mdType]["count"]});
        }
      };
    }
    
    return this._mdFullInvArray;
  },

  getMonitoredInvArray: function() {
    if(!this._mdMonitoredInvArray) {
      this._mdMonitoredInvArray = [];
      monitoredTypes.forEach(element => {
        let retObj = {};
        let extras = [];
        let extrasCustom = [];
        let extrasStandard = []; 
        let count = 0;
        retObj['metadataType'] = element.metadataType;
        retObj['Metadata Type'] = element.name;
        if (element.metadataType) {
          switch (String(element.metadataType)) {
            
            case 'CustomField' :
               if (this._mdInv[element.metadataType]) {
                 count = this._mdInv[element.metadataType]['count'];
                 const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                 let standardObjFields = {metadataSubType: 'StandardObjectFields', 'Metadata Type': '  Total Fields on Standard Objects', 'count' : 0};
                 let customObjFields = {metadataSubType: 'CustomObjectFields', 'Metadata Type': '  Total Fields on Custom Objects', 'count' : 0};
                  
                 for (const obj of objects) {
                    let objFieldCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                     
                    
                    if (this._mdInv[element.metadataType]['objects'][obj]['objectType'] === 'Custom') {
                      customObjFields['count']+=objFieldCount;
                      extrasCustom.push({metadataSubType: `object.${obj}`, 'Metadata Type': `   Fields on ${obj}`, 'count': objFieldCount});
                    }
                    else {
                      standardObjFields['count']+=objFieldCount;
                      extrasStandard.push({metadataSubType: `object.${obj}`, 'Metadata Type': `   Fields on ${obj}`, 'count': objFieldCount});
                    }
                 }
                 extras.push(standardObjFields);
                 extras = extras.concat(extrasStandard);
                 extras.push(customObjFields);
                 extras = extras.concat(extrasCustom);

               }
            break;
            case 'CustomApplication' :
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({metadataSubType:'LightningApp','Metadata Type': '  Lighting Applications', count: this._mdInv[element.metadataType]['LightingAppCount']});
                extras.push({metadataSubType:'LigthingConsole','Metadata Type': '   Lighting Consoles', count: this._mdInv[element.metadataType]['LightningConsoleCount']});
                extras.push({metadataSubType:'ClassicApp', 'Metadata Type': '  Classic Applications', count: this._mdInv[element.metadataType]['ClassicAppCount']});
                extras.push({metadataSubType:'ClassicConsole', 'Metadata Type': '   Classic Consoles', count: this._mdInv[element.metadataType]['ClassicConsoleCount']});
              }
            break;
            case 'ApexClass' :
                if (this._mdInv[element.metadataType]) {
                  count = this._mdInv[element.metadataType]['count'];
                //  extras.push({metadataSubType:'ApexTest', 'Metadata Type': '  With Tests', count: this._mdInv[element.metadataType]['TestMethods']});
                  extras.push({metadataSubType:'ApexFuture', 'Metadata Type': '  With Future Methods', count: this._mdInv[element.metadataType]['FutureCalls']});
                  extras.push({metadataSubType:'AuraEnabled', 'Metadata Type': '  With Aura Enabled Methods', count: this._mdInv[element.metadataType]['AuraEnabledCalls']});
                  extras.push({metadataSubType:'InvocableApex', 'Metadata Type': '  With Invocable Methods or Variables', count: this._mdInv[element.metadataType]['InvocableCalls']});
                  extras.push({metadataSubType:'BatchApex', 'Metadata Type': '  Batch Apex', count: this._mdInv[element.metadataType]['BatchApex']});
                  extras.push({metadataSubType:'ApexRest', 'Metadata Type': '  Apex REST', count: this._mdInv[element.metadataType]['ApexRest']});
                  extras.push({metadataSubType:'ApexSoap','Metadata Type': '  SOAP Web Services', count: this._mdInv[element.metadataType]['ApexSoap']});
                  extras.push({metadataSubType:'SchedulableApex','Metadata Type': '  Schedulable Apex', count: this._mdInv[element.metadataType]['SchedulableApex']});
                  
                }
            break;
            case 'Flow' :
                if (this._mdInv[element.metadataType]) {
                  count = this._mdInv[element.metadataType]['count'];
                  extras.push({metadataSubType:'ScreenFlow', 'Metadata Type': '  Screen Flows', count: this._mdInv[element.metadataType]['Flow']}); 
                  extras.push({metadataSubType:'AutoLaunchedFlow', 'Metadata Type': '  Autolaunched Flows', count: this._mdInv[element.metadataType]['AutoLaunchedFlow']}); 
                  extras.push({metadataSubType:'ProcessBuilder', 'Metadata Type': '  Process Builder', count: this._mdInv[element.metadataType]['Workflow']}); 
                  
                  const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                  for (const obj of objects) {
                    let objPBTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                     extras.push({metadataSubType: `object.${obj}`, 'Metadata Type': `    Process Builders on ${obj}`, 'count': objPBTriggerCount });
                    
                 }
                 extras.push({metadataSubType:'FlowTemplate', 'Metadata Type': '  Flow Templates', count: this._mdInv[element.metadataType]['FlowTemplate']}); 
                 extras.push({metadataSubType:'FlowTemplate', 'Metadata Type': '    Screen Flow Templates', count: this._mdInv[element.metadataType]['ScreenFlowTemplate']}); 
                 extras.push({metadataSubType:'FlowTemplate', 'Metadata Type': '    Autolaunched Flow Templates', count: this._mdInv[element.metadataType]['AutoLaunchedFlowTemplate']}); 
                }
            break;
            case 'ConnectedApp' :
                if (this._mdInv[element.metadataType]) {
                  count = this._mdInv[element.metadataType]['count'];
                  extras.push({metadataSubType:'CanvasApp', 'Metadata Type': '  Canvas Apps', count: this._mdInv[element.metadataType]['CanvasApp']}); 
                }
            break;
            case 'CustomObject' :
                if (this._mdInv[element.metadataType]) {
                  count = this._mdInv[element.metadataType]['count'];
                  extras.push({metadataSubType:'BigObject', 'Metadata Type': '  Big Objects', count: this._mdInv[element.metadataType]['BigObject']}); 
                  extras.push({metadataSubType:'ExternalObject', 'Metadata Type': '  External Objects', count: this._mdInv[element.metadataType]['ExternalObject']}); 
                  

                }
            break;
            case 'ApexTrigger' :
                if (this._mdInv[element.metadataType]) {
                  count = this._mdInv[element.metadataType]['count'];
                  extras.push({metadataSubType:'AsyncTrigger', 'Metadata Type': '  Async Triggers', count: this._mdInv[element.metadataType]['AsyncTrigger']}); 
                  const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                  for (const obj of objects) {
                    let objTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                     extras.push({metadataSubType: `object.${obj}`, 'Metadata Type': `  Triggers on ${obj}`, 'count': objTriggerCount });
                    
                 }
                }
            break;
            case 'LightningComponentBundle' :
                if (this._mdInv[element.metadataType]) {
                  count = this._mdInv[element.metadataType]['count'];
                  extras.push({metadataSubType:'ExposedComponents', 'Metadata Type': '  Exposed Components', count: this._mdInv[element.metadataType]['ExposedComponents']});
                  extras.push({metadataSubType:'RecordPageComponents', 'Metadata Type': '  Record Page Components', count: this._mdInv[element.metadataType]['RecordPageComponents']});
                  extras.push({metadataSubType:'AppPageComponents', 'Metadata Type': '  App Page Components', count: this._mdInv[element.metadataType]['AppPageComponents']});
                  extras.push({metadataSubType:'HomePageComponents', 'Metadata Type': '  Home Page Components', count: this._mdInv[element.metadataType]['HomePageComponents']});
                  extras.push({metadataSubType:'FlowScreenComponents', 'Metadata Type': '  Flow Screen Components', count: this._mdInv[element.metadataType]['FlowScreenComponents']});
                  
                }
            break;
            default:
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
              }
          }
        
        }
        else {count=-1};
        retObj['count'] = count;
        this._mdMonitoredInvArray.push(retObj);
        if (extras.length > 0) {
          this._mdMonitoredInvArray = this._mdMonitoredInvArray.concat(extras);
        }
       // this.getElementRecommendation(element,count, extras);
       
      });
    }
    return this._mdMonitoredInvArray;
  },

};

export {packageInventory};
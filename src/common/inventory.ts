/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { rules, editions, alerts } from './rules';

const editionRules = editions;
const monitoredTypes = rules;
const pushAlertDefs = alerts;

const packageInventory = {
  _mdInv: {},
  _mdFullInvArray: undefined,
  _mdMonitoredInvArray: undefined,
  _recomendations: [],


  getInstallationWarnings: function(){
    
    let warnings = [];
    for (var edition of editionRules) { 
      let editionBlock = [];
      for (var blockingType of edition['blockingItems']) {
        if (this.getInventoryCountByMetadataType(blockingType['metadataType']) > blockingType['threshold'] ) {
          if (blockingType['requiresSR']) {
            editionBlock.push(` -${blockingType['label']} count is greater than ${blockingType['threshold']}. Package cannot be installed without Security Review`);
          }
          else {
            editionBlock.push(` -${blockingType['label']} count is greater than ${blockingType['threshold']}`);
          }
        }
      }
      if (editionBlock.length > 0) {
        warnings.push(`Package cannot be installed in ${edition['name']} due to:`);
        warnings.push(editionBlock.join('\n'));
      }
    }
    if (warnings.length > 0) {
      return warnings.join('\n');
    }
    else {
      return 'Can be installed in any Edition';
    }
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

  setMetadata: function(md) {
    this._mdInv = md;
  },

  getInventoryCountByMetadataType(metadataType) {
    let mdType = metadataType.split('.'); //To look at subtypes, use Type.Subtype (e.g.: ApexClass.BatchApex)
    let key = mdType[1] ? mdType[1] : 'count';
    let count = 0;
    if (this._mdInv[mdType[0]]) {
      if (key === 'object' && mdType[2]) {
        let targetObj = mdType[2];
        if (this._mdInv[mdType[0]]['objects'] && this._mdInv[mdType[0]]['objects'][targetObj]) {
          count = this._mdInv[mdType[0]]['objects'][targetObj]['count'];
        }
      }
      else {
        if (this._mdInv[mdType[0]][key]) {
          count = this._mdInv[mdType[0]][key];
        }
      }
      
    }
    return count;
  },
  getJSONOutput: function() {
    let retVal = {};
    retVal['MetadataInventory'] = this._mdInv;
    retVal['InventoryArray'] = this.getFullInvArray();
    retVal['MonitoredItems'] = this.getMonitoredInvArray();
    retVal['Recommendations'] = this._recomendations;
    retVal['InstallationWarnings']  = this.getInstallationWarnings();
    retVal['Alerts'] = this.getAlerts();
    return retVal;
  },

  getRulesJSON: function() {
    return '';
  },

  getRecommendations: function() {
    return this._recomendations.join('\n');
  },

  

  getFullInvArray: function() {
    if (!this._mdFullInvArray) {
      this._mdFullInvArray = [];
      for (var mdType in this._mdInv) {
        if (!this._mdInv.hasOwnProperty(mdType)) continue;
        this._mdFullInvArray.push({"metadataType": mdType, "count": this._mdInv[mdType]["count"]});
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
                  extras.push({metadataSubType:'FlowTemplate', 'Metadata Type': '  Flows With Template', count: this._mdInv[element.metadataType]['FlowTemplate']}); 
                  extras.push({metadataSubType:'ScreenFlow', 'Metadata Type': '  Screen Flows', count: this._mdInv[element.metadataType]['Flow']}); 
                  extras.push({metadataSubType:'AutoLaunchedFlow', 'Metadata Type': '  Autolanched Flows', count: this._mdInv[element.metadataType]['AutoLaunchedFlow']}); 
                  extras.push({metadataSubType:'ProcessBuilder', 'Metadata Type': '  Process Builder', count: this._mdInv[element.metadataType]['Workflow']}); 
                  const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                  for (const obj of objects) {
                    let objPBTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                     extras.push({metadataSubType: `object.${obj}`, 'Metadata Type': `  Process Builders on ${obj}`, 'count': objPBTriggerCount });
                    
                 }
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
        this.getElementRecommendation(element,count, extras);
       
      });
    }
    return this._mdMonitoredInvArray;
  },

  getElementRecommendation: function (element,count, detailArray) {
    if (element.threshold !=undefined) {
      if (count > element.threshold) {
        if (element.recPos) {
          this._recomendations.push(`${element.name}:\n ${element.recPos.message}\n\tURL:${element.recPos.url}\n`);
        }  
      }
      else {
        if (element.recNeg) {
          this._recomendations.push(`${element.name}:\n ${element.recNeg.message}\n\tURL:${element.recNeg.url}\n`);
        }
      }
    }

    if (element.detailThreshold !=undefined ) {
      element.detailThreshold.forEach(detailThreshold => {
        detailArray.forEach(detailCount => {
          if (detailCount['metadataSubType'] === detailThreshold.metadataSubType || detailThreshold.metadataSubType === '*')  {
            if (detailCount['count'] > detailThreshold.threshold) {
              if (detailThreshold.recPos) {
                this._recomendations.push(`${detailCount['Metadata Type'].trim()}:\n ${detailThreshold.recPos.message}\n\tURL:${detailThreshold.recPos.url}\n`);
              }
            }
            else {
              if (detailThreshold.recNeg) {
                this._recomendations.push(`${detailCount['Metadata Type'].trim()}:\n ${detailThreshold.recNeg.message}\n\tURL:${detailThreshold.recNeg.url}`);
              }
            }
          }
        });
      });
    }

  },


};

export {packageInventory};
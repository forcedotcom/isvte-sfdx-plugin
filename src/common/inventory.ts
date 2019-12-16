/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  mdTypes,
  editionWarningRules,
  enablementRules,
  qualityRules,
  alertRules,
  minAPI
} from './rules';
import {
  loggit
} from './logger';


export class packageInventory {
  private _mdInv = {};
  private _mdFullInvArray;
  private _mdMonitoredInvArray;
  private loggit;
  private _minAPI = minAPI;

  public constructor() {
    this.loggit = new loggit('isvtePlugin:PackageInventory');
    this.loggit.loggit('Creating New Package Inventory');
  };

  public setMinAPI(newAPIVersion) {
    //set this to be just below the minimum because recNeg uses less than or equal. We just want less than for API checks 
    this._minAPI = newAPIVersion - .01; 
  };

  public setMetadata(md) {
    this.loggit.loggit('Setting Metadata');
    this._mdInv = md;
  };

  public getInstallationWarnings() {
    this.loggit.loggit('Getting Installation Warnings');
    let warnings = [];
    for (var edition of editionWarningRules) {
      this.loggit.loggit('Checking Edition Rule:' + JSON.stringify(edition));
      let editionBlock = [];
      for (var blockingType of edition['blockingItems']) {
        this.loggit.loggit('Checking Blocing Item: ' + JSON.stringify(blockingType));
        if (this.getInventoryCountByMetadataType(blockingType['metadataType']) > blockingType['threshold']) {
          if (blockingType['requiresSR']) {
            editionBlock.push({
              metadataType: blockingType['metadataType'],
              label: blockingType['label'],
              requiresSR: blockingType['requiresSR'],
              threshold: blockingType['threshold'],
              count: this.getInventoryCountByMetadataType(blockingType['metadataType'])
            });
          } else {
            editionBlock.push({
              metadataType: blockingType['metadataType'],
              label: blockingType['label'],
              threshold: blockingType['threshold'],
              count: this.getInventoryCountByMetadataType(blockingType['metadataType'])
            });
          }
        }
      }
      if (editionBlock.length > 0) {
        this.loggit.loggit('Blocks Found for edition ' + edition['name']);
        warnings.push({
          'edition': edition['name'],
          blockingItems: editionBlock
        });
      }
    }
    return warnings;
  };

  public getAlerts() {
    this.loggit.loggit('Getting Alerts');
    let alerts = [];
    const now = new Date().toJSON();
    for (var alertDef of alertRules) {
      this.loggit.loggit('Checking Relevance of alert: ' + JSON.stringify(alertDef));
      let exceptions = [];
   /*   if ((alertDef.expiration > now) && this.getInventoryCountByMetadataType(alertDef['metadataType']) > 0) {
        alerts.push(alertDef);
      }*/
      if (alertDef.expiration > now) {
        let found = false;
        for (var count of this.getCountByMetadataType(alertDef['metadataType'])) {
          if (count.value > 0) {
            exceptions.push(count.property);
          }
        }
        if (exceptions.length > 0) {
          alerts.push({
              metadataType: alertDef.metadataType,
              label: alertDef.label,
              message: alertDef.message,
              exceptions: exceptions,
              url: alertDef.url
            });
         
        }
      }
       
    }
    return alerts;
  };

  public getQualityRecommendations() {
    this.loggit.loggit('Checking Quality Recommendation Rules');
    return this.checkRules(qualityRules);
  };

  public getEnablementMessages() {
    this.loggit.loggit('Checking Enablement Content Rules');
    return this.checkRules(enablementRules)
  };

  public checkRules(ruleSet) {
    this.loggit.loggit('Diving into Rules');
    let recomendations = [];
    for (var ruleDef of ruleSet) {
      this.loggit.loggit('Rule: ' + JSON.stringify(ruleDef));
      let threshold = ruleDef.threshold;
      if (ruleDef.metadataType.split('.')[0] == 'apiVersions') {
        this.loggit.loggit('-------Checking an API type rule');
        threshold = this._minAPI;
      }
      this.loggit.loggit('Threshold is: ' + threshold);
      let counts = this.getCountByMetadataType(ruleDef.metadataType);
      this.loggit.loggit('Counts: ' + JSON.stringify(counts));
      if (ruleDef.recNeg) {
        let exceptions = [];
        if (counts.length == 0 && threshold == -1) {
          this.loggit.loggit('No results found and Threshold is -1. Pushing Negative exception');
          recomendations.push({
            metadataType: ruleDef.metadataType,
            label: ruleDef['label'],
            message: ruleDef['recNeg']['message'],
            url: ruleDef['recNeg']['url']
          });
        } else {
          for (var count of counts) {
            this.loggit.loggit(`Comparing count: ${count.value} against threshold ${threshold}`);
            if (count.value <= threshold) {
              this.loggit.loggit(`Property Name: ${count.property} count ${count.value} is less than ${threshold}`);
              exceptions.push(count.property);
            }
          }
          if (exceptions.length > 0) {
            recomendations.push({
              metadataType: ruleDef.metadataType,
              label: ruleDef['label'],
              message: ruleDef['recNeg']['message'],
              'exceptions': exceptions,
              url: ruleDef['recNeg']['url']
            });
          }
        }
      }
      if (ruleDef.recPos) {
        let exceptions = [];
        for (var count of counts) {
          this.loggit.loggit(`Comparing count: ${count.value} against threshold ${threshold}`);
          if (count.value > threshold) {
            this.loggit.loggit(`Property Name: ${count.property} count ${count.value} is greater than ${threshold}`);

            exceptions.push(count.property);
          }
        }
        if (exceptions.length > 0) {
          recomendations.push({
            metadataType: ruleDef.metadataType,
            label: ruleDef['label'],
            message: ruleDef['recPos']['message'],
            'exceptions': exceptions,
            url: ruleDef['recPos']['url']
          });
        }
      }
    }
    this.loggit.loggit('Final Recommendations: ' + JSON.stringify(recomendations));
    return recomendations;
  };

  public getCountByMetadataType(metadataType) {
    this.loggit.loggit('getCountByMetadataType - Getting Count of Metadata by type: ' + metadataType);
    let mdDefArray = metadataType.split('.');
    let retVal = [];
    let mdCount = this.traverseMetadata(mdDefArray, this._mdInv);
    if (Array.isArray(mdCount)) {
      this.loggit.loggit('Found an Array of results. We must have passed a wildcard search');
      retVal = mdCount;
    } else {
      this.loggit.loggit('Found a single result');
      if (mdCount.value == -1) {
        retVal = [];
      }
      else retVal.push(mdCount);
    }
    return retVal;
  };

  public traverseMetadata(mdArray, mdObject, wildcard = '') {
    //  Recurses through mdArray -- a sequential list of properties to navigate down the object, mdObject
    //
    // Check the first element in the array. 
    // If it's a wildcard (*), go through all top level properties of the object calling this function again for each property of the object 
    // If it is not a wildcard, check to see if that value exists as a key of the object.
    // If value exists and there exist more entries in the properties array, recursively call this function with parameters mdArray = (original mdArray with first entry removed), mdObject = mdObject['Property that was removed from mdArray']
    // if value exists and there are no more entries in the array, check to see if the value is a number
    // If it is a number, then return the number and the property name (or the wildcard name)
    // If it is not a number, then check to see if adding .count to the property is a number
    this.loggit.loggit('Traversing Metadata');
    this.loggit.loggit('Properties to traverse: ' + JSON.stringify(mdArray));
    let topLevel = mdArray.shift();
    this.loggit.loggit('Looking at: ' + topLevel);
    if (topLevel === '*') {
      let retVal = [];
      this.loggit.loggit('Checking Wildcard');
      for (var topArray in mdObject) {
        let tmpArray = [topArray, ...mdArray];

        this.loggit.loggit('checking new Array: ' + tmpArray);
        this.loggit.loggit(`ParamArray: ${tmpArray}, Wildcard: ${topArray}`);
        retVal.push(this.traverseMetadata(tmpArray, mdObject, topArray));
      }
      this.loggit.loggit('Wildcard Processed');
      return retVal;
    } else if (mdObject[topLevel] != undefined) {
      if (mdArray.length > 0) {
        this.loggit.loggit('There are more components left. Recursing');
        this.loggit.loggit(`  ObjectKey: ${topLevel} ParamArray: ${mdArray}, Wildcard: ${wildcard}`);
        return this.traverseMetadata(mdArray, mdObject[topLevel], wildcard);
      } else {
        this.loggit.loggit('This is last portion. Looking for value');
        let count = undefined;
        if (isNaN(mdObject[topLevel])) {
          this.loggit.loggit(`${mdObject[topLevel]} is not a number. Checking .count`);
          if (mdObject[topLevel]['count'] != undefined && isFinite(mdObject[topLevel]['count'])) {
            count = mdObject[topLevel]['count'];
          } else {
            this.loggit.loggit(' Cannot find a valid number returning empty object');
            return {};
          }

        } else {
          this.loggit.loggit('Using value from ' + topLevel);
          count = mdObject[topLevel];
        }
        this.loggit.loggit('Final Value:' + count);
        let componentName = wildcard == '' ? topLevel : wildcard;
        return {
          property: componentName,
          value: count
        };
      }

    } else {
      this.loggit.loggit(`could not find Key ${topLevel} in the object.`);
      return {
        property: topLevel,
        value: -1
      };
    }
  };


  public getInventoryCountByMetadataType(metadataType) {
    this.loggit.loggit('getInventoryCountByMetadataType - Getting Count of mdType: ' + metadataType);
    let mdType = this.parseMetadataType(metadataType);
    let count = 0;
    if (this._mdInv[mdType.metadataType] != undefined) {
      if (mdType.key === 'object' && mdType['targetObj'] != undefined) {
        if (this._mdInv[mdType.metadataType]['objects'] != undefined && this._mdInv[mdType.metadataType]['objects'][mdType['targetObj']] != undefined) {
          count = this._mdInv[mdType.metadataType]['objects'][mdType['targetObj']]['count'];
        }
      } else {
        if (this._mdInv[mdType.metadataType][mdType.key] != undefined) {
          count = this._mdInv[mdType.metadataType][mdType.key];
        }
      }

    }
    return count;
  };

  public parseMetadataType(metadataType) {
    this.loggit.loggit('Parsing Metadata Type' + metadataType);
    let mdType = metadataType.split('.'); //To look at subtypes, use Type.Subtype (e.g.: ApexClass.BatchApex)
    let key = mdType[1] ? mdType[1] : 'count';
    let parsedType = {
      'metadataType': mdType[0],
      'key': key
    };
    if (key === 'object' && mdType[2]) {
      parsedType['targetObj'] = mdType[2];
    }
    if (mdType[0] === 'apiVersions' && mdType[2]) {
      parsedType['targetComponent'] = mdType[2];
    }
    this.loggit.loggit('Parsed Result: ' + JSON.stringify(parsedType));
    return parsedType;
  };

  public getJSONOutput() {
    this.loggit.loggit('Getting JSON output');
    let retVal = {};
    retVal['MetadataInventory'] = this._mdInv;
    retVal['MonitoredItems'] = this.getMonitoredInvArray();
    retVal['Recommendations'] = this.getEnablementMessages();
    retVal['CodeQualityNotes'] = this.getQualityRecommendations();
    retVal['InstallationWarnings'] = this.getInstallationWarnings();
    retVal['Alerts'] = this.getAlerts();
    return retVal;
  };


  public getFullInvArray() {
    this.loggit.loggit('Getting Full Inventory');
    if (!this._mdFullInvArray) {
      this._mdFullInvArray = [];
      for (var mdType in this._mdInv) {
        if (mdType !== 'apiVersions') {
          this._mdFullInvArray.push({
            "metadataType": mdType,
            "count": this._mdInv[mdType]["count"]
          });
        }
      };
    }

    return this._mdFullInvArray;
  };

  public getMonitoredInvArray() {
    this.loggit.loggit('Getting Monitored Inventory');
    if (!this._mdMonitoredInvArray) {
      this._mdMonitoredInvArray = [];
      mdTypes.forEach(element => {
        this.loggit.loggit('Processing Monitored Item: ' + JSON.stringify(element));
        let retObj = {};
        let extras = [];
        let extrasCustom = [];
        let extrasStandard = [];
        let count = 0;
        retObj['metadataType'] = element.metadataType;
        retObj['Metadata Type'] = element.name;
        if (element.metadataType) {
          switch (String(element.metadataType)) {

            case 'CustomField':
              this.loggit.loggit('Checking Custom Fields');
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                let standardObjFields = {
                  metadataSubType: 'StandardObjectFields',
                  'Metadata Type': '  Total Fields on Standard Objects',
                  'count': 0
                };
                let customObjFields = {
                  metadataSubType: 'CustomObjectFields',
                  'Metadata Type': '  Total Fields on Custom Objects',
                  'count': 0
                };

                for (const obj of objects) {
                  let objFieldCount = this._mdInv[element.metadataType]['objects'][obj]['count'];


                  if (this._mdInv[element.metadataType]['objects'][obj]['objectType'] === 'Custom') {
                    customObjFields['count'] += objFieldCount;
                    extrasCustom.push({
                      metadataSubType: `object.${obj}`,
                      'Metadata Type': `   Fields on ${obj}`,
                      'count': objFieldCount
                    });
                  } else {
                    standardObjFields['count'] += objFieldCount;
                    extrasStandard.push({
                      metadataSubType: `object.${obj}`,
                      'Metadata Type': `   Fields on ${obj}`,
                      'count': objFieldCount
                    });
                  }
                }
                extras.push(standardObjFields);
                extras = extras.concat(extrasStandard);
                extras.push(customObjFields);
                extras = extras.concat(extrasCustom);

              }
              break;
            case 'CustomApplication':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'LightningApp',
                  'Metadata Type': '  Lighting Applications',
                  count: this._mdInv[element.metadataType]['LightingAppCount']
                });
                extras.push({
                  metadataSubType: 'LigthingConsole',
                  'Metadata Type': '   Lighting Consoles',
                  count: this._mdInv[element.metadataType]['LightningConsoleCount']
                });
                extras.push({
                  metadataSubType: 'ClassicApp',
                  'Metadata Type': '  Classic Applications',
                  count: this._mdInv[element.metadataType]['ClassicAppCount']
                });
                extras.push({
                  metadataSubType: 'ClassicConsole',
                  'Metadata Type': '   Classic Consoles',
                  count: this._mdInv[element.metadataType]['ClassicConsoleCount']
                });
              }
              break;
            case 'ApexClass':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                //  extras.push({metadataSubType:'ApexTest', 'Metadata Type': '  With Tests', count: this._mdInv[element.metadataType]['TestMethods']});
                extras.push({
                  metadataSubType: 'ApexFuture',
                  'Metadata Type': '  With Future Methods',
                  count: this._mdInv[element.metadataType]['FutureCalls']
                });
                extras.push({
                  metadataSubType: 'AuraEnabled',
                  'Metadata Type': '  With Aura Enabled Methods',
                  count: this._mdInv[element.metadataType]['AuraEnabledCalls']
                });
                extras.push({
                  metadataSubType: 'InvocableApex',
                  'Metadata Type': '  With Invocable Methods or Variables',
                  count: this._mdInv[element.metadataType]['InvocableCalls']
                });
                extras.push({
                  metadataSubType: 'BatchApex',
                  'Metadata Type': '  Batch Apex',
                  count: this._mdInv[element.metadataType]['BatchApex']
                });
                extras.push({
                  metadataSubType: 'ApexRest',
                  'Metadata Type': '  Apex REST',
                  count: this._mdInv[element.metadataType]['ApexRest']
                });
                extras.push({
                  metadataSubType: 'ApexSoap',
                  'Metadata Type': '  SOAP Web Services',
                  count: this._mdInv[element.metadataType]['ApexSoap']
                });
                extras.push({
                  metadataSubType: 'SchedulableApex',
                  'Metadata Type': '  Schedulable Apex',
                  count: this._mdInv[element.metadataType]['SchedulableApex']
                });

              }
              break;
            case 'Flow':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'ScreenFlow',
                  'Metadata Type': '  Screen Flows',
                  count: this._mdInv[element.metadataType]['Flow']
                });
                extras.push({
                  metadataSubType: 'AutoLaunchedFlow',
                  'Metadata Type': '  Autolaunched Flows',
                  count: this._mdInv[element.metadataType]['AutoLaunchedFlow']
                });
                extras.push({
                  metadataSubType: 'ProcessBuilder',
                  'Metadata Type': '  Process Builder',
                  count: this._mdInv[element.metadataType]['Workflow']
                });

                const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                for (const obj of objects) {
                  let objPBTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                  extras.push({
                    metadataSubType: `object.${obj}`,
                    'Metadata Type': `    Process Builders on ${obj}`,
                    'count': objPBTriggerCount
                  });

                }
                extras.push({
                  metadataSubType: 'FlowTemplate',
                  'Metadata Type': '  Flow Templates',
                  count: this._mdInv[element.metadataType]['FlowTemplate']
                });
                extras.push({
                  metadataSubType: 'FlowTemplate',
                  'Metadata Type': '    Screen Flow Templates',
                  count: this._mdInv[element.metadataType]['ScreenFlowTemplate']
                });
                extras.push({
                  metadataSubType: 'FlowTemplate',
                  'Metadata Type': '    Autolaunched Flow Templates',
                  count: this._mdInv[element.metadataType]['AutoLaunchedFlowTemplate']
                });
              }
              break;
            case 'ConnectedApp':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'CanvasApp',
                  'Metadata Type': '  Canvas Apps',
                  count: this._mdInv[element.metadataType]['CanvasApp']
                });
              }
              break;
            case 'CustomObject':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'BigObject',
                  'Metadata Type': '  Big Objects',
                  count: this._mdInv[element.metadataType]['BigObject']
                });
                extras.push({
                  metadataSubType: 'ExternalObject',
                  'Metadata Type': '  External Objects',
                  count: this._mdInv[element.metadataType]['ExternalObject']
                });


              }
              break;
            case 'ApexTrigger':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'AsyncTrigger',
                  'Metadata Type': '  Async Triggers',
                  count: this._mdInv[element.metadataType]['AsyncTrigger']
                });
                const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                for (const obj of objects) {
                  let objTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                  extras.push({
                    metadataSubType: `object.${obj}`,
                    'Metadata Type': `  Triggers on ${obj}`,
                    'count': objTriggerCount
                  });

                }
              }
              break;
            case 'LightningComponentBundle':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'ExposedComponents',
                  'Metadata Type': '  Exposed Components',
                  count: this._mdInv[element.metadataType]['ExposedComponents']
                });
                extras.push({
                  metadataSubType: 'RecordPageComponents',
                  'Metadata Type': '  Record Page Components',
                  count: this._mdInv[element.metadataType]['RecordPageComponents']
                });
                extras.push({
                  metadataSubType: 'AppPageComponents',
                  'Metadata Type': '  App Page Components',
                  count: this._mdInv[element.metadataType]['AppPageComponents']
                });
                extras.push({
                  metadataSubType: 'HomePageComponents',
                  'Metadata Type': '  Home Page Components',
                  count: this._mdInv[element.metadataType]['HomePageComponents']
                });
                extras.push({
                  metadataSubType: 'FlowScreenComponents',
                  'Metadata Type': '  Flow Screen Components',
                  count: this._mdInv[element.metadataType]['FlowScreenComponents']
                });

              }
              break;
            default:
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
              }
          }

        } else {
          count = -1
        };
        retObj['count'] = count;
        this._mdMonitoredInvArray.push(retObj);
        if (extras.length > 0) {
          this._mdMonitoredInvArray = this._mdMonitoredInvArray.concat(extras);
        }
      });
    }
    return this._mdMonitoredInvArray;
  };

};

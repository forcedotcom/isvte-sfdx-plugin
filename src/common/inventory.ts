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
  minAPI,
  techAdoptionRules,
  alertRulesNew
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


  private checkCondition(cond) {
    this.loggit.loggit('Checking Condition:' + JSON.stringify(cond));
    let response = {
      conditionPass: false,
      passItems: [],
      failItems: []
    };
    if (!this.isConditionValid(cond)) {
      this.loggit.loggit('Condition is not valid. Returning false')
      return response;
    }
    if (cond.metadataType != undefined) {
      this.loggit.loggit('Checking Condition Metadata type:' + cond.metadataType);
      let mdTypeCount = this.getCountByMetadataType2(cond.metadataType);
      if (mdTypeCount.length == 0) {
        this.loggit.loggit('Checking Condition. empty response receieved. We should not end up here');
        mdTypeCount.push({
          property: cond.metadataType,
          value: -1
        });
      }
      let compare = cond.metadataType.split('.')[0] == 'apiVersions' ? this._minAPI : cond.compare;

      for (var itemCount of mdTypeCount) {
        this.loggit.loggit('Validating item:' + itemCount.property);
        this.loggit.loggit('  Value:' + itemCount.value);
        this.loggit.loggit('  Operator:' + cond.operator);
        this.loggit.loggit('  CompareTo:' + compare);
        let itemPass = false;
        switch (cond.operator) {
          case 'always':
            itemPass = true;
            break;
          case 'never':
            itemPass = false;
            break;
          case 'exists':
            itemPass = itemCount.value > 0;
            break;
          case 'notexists':
            itemPass = itemCount.value <= 0;
            break;
          case 'null':
            itemPass = itemCount.value < 0;
            break;
          case 'gt':
            itemPass = compare < itemCount.value;
            break;
          case 'gte':
            itemPass = compare <= itemCount.value;
            break;
          case 'lt':
            itemPass = compare > itemCount.value;
            break;
          case 'lte':
            itemPass = compare >= itemCount.value;
            break;
          case 'eq':
            itemPass = compare == itemCount.value;
            break;
        }
        if (itemPass) {
          this.loggit.loggit('    Condition Passed');
          response.conditionPass = true;
          response.passItems.push(itemCount.property);
        } else {
          this.loggit.loggit('    Condition Failed');
          response.failItems.push(itemCount.property);
        }
      }
      if (cond.conditionOr != undefined) {
        this.loggit.loggit('Checking OR condition');
        //By default, don't process the OR if the condition has already passed
        if (cond.conditionOr.processAlways == true || !response.conditionPass) {
          let orResponse = this.checkCondition(cond.conditionOr);
          response.conditionPass = response.conditionPass || orResponse.conditionPass;

          response.passItems.push(...orResponse.passItems);
          response.failItems.push(...orResponse.failItems);
        }
      }
      if (cond.conditionAnd != undefined) {
        this.loggit.loggit('Checking AND condition');
        //By default, don't process the AND if the condition is already false
        if (cond.conditionAnd.processAlways == true || response.conditionPass) {
          let andResponse = this.checkCondition(cond.conditionAnd);
          if (cond.conditionAnd.conditionPerItem) {
            this.loggit.loggit('Checking condition per item in the AND');
            this.loggit.loggit('Core Condition passes: ' + JSON.stringify(response.passItems));
            this.loggit.loggit('And Condition passes: ' + JSON.stringify(andResponse.passItems));
            //Condition passes if the same property passes in both this condition and in conditionAnd
            response.passItems = response.passItems.filter(item => andResponse.passItems.includes(item));
            this.loggit.loggit('Intersection of core and and Conditions: ' + JSON.stringify(response.passItems));
            //Logic correct here? Fail will return items that do not pass both conditions. Items that pass one condition but not the other are lost.
            response.failItems = response.failItems.filter(item => andResponse.failItems.includes(item));
            response.conditionPass = response.passItems.length > 0;
          } else {
            response.conditionPass = response.conditionPass && andResponse.conditionPass;
            response.passItems.push(...andResponse.passItems);
            response.failItems.push(...andResponse.failItems);
          }
        }
      }
    }
    return response;
  }

  private isConditionValid(cond) {
    this.loggit.loggit('Checking validity of Condition:' + JSON.stringify(cond));
    let isValid = true;
    let validOperators = ['always', 'never', 'exists', 'notexists', 'null', 'gt', 'gte', 'lt', 'lte', 'eq'];
    let operatorsNeedCompare = ['gt', 'gte', 'lt', 'lte', 'eq'];
    //Check Expiration
    if (cond['expiration'] != undefined) {
      const now = new Date().toJSON();
      if (cond.expiration < now) {
        this.loggit.loggit('Condition has expired. Expiration:' + cond.expiration);
        isValid = false;
      }
    }
    //Cannot have both conditionAnd and conditionOr properties
    if (cond['conditionAnd'] != undefined && cond['conditionOr'] != undefined) {
      this.loggit.loggit('Condition has both AND and OR sub conditions. Not OK');
      isValid = false;
    }
    //Make sure Operator is valid
    if (!validOperators.includes(cond['operator'])) {
      this.loggit.loggit('Condition Operator is not valid: ' + cond['operator']);
      isValid = false;
    }
    //Make sure Operators that require a comparitor have one
    if (operatorsNeedCompare.includes(cond['operator']) && isNaN(cond['compare'])) {
      this.loggit.loggit('Operator ' + cond['operator'] + ' requires a value to compare against. Compare:' + cond['compare']);
      isValid = false;
    }
    return isValid;
  }

  private isRuleValid(rule) {

    return (rule['name'] != undefined &&
      rule['label'] != undefined &&
      rule['condition'] != undefined
      //          && rule['metadataType'] != undefined
      &&
      (rule['resultTrue'] != undefined || rule['resultFalse'] != undefined))
  }

  public processRules(ruleSet) {
    //Replaces   public checkRules(ruleSet) 
    let results = [];
    this.loggit.loggit('Checking Rules');
    for (var rule of ruleSet) {
      this.loggit.loggit('Checking rule: ' + rule.name);
      if (!this.isRuleValid(rule)) {
        this.loggit.loggit('Rule is invalid. Skipping it.');
        continue;
      }
      let conditionResult = this.checkCondition(rule.condition);
      if (conditionResult.conditionPass && rule.resultTrue != undefined) {
        let result = {};
        //        result['metadataType'] = rule.metadataType;
        result['label'] = rule.label;
        result['message'] = rule.resultTrue.message;
        if (rule.resultTrue.url != undefined) {
          result['url'] = rule.resultTrue.url;
        }
        if (rule.resultTrue.showDetails) {
          result['exceptions'] = conditionResult.passItems;
        }
        results.push(result);
      }
      if (!conditionResult.conditionPass && rule.resultFalse != undefined) {
        let result = {};
        //      result['metadataType'] = rule.metadataType;
        result['label'] = rule.label;
        result['message'] = rule.resultFalse.message;
        if (rule.resultFalse.url != undefined) {
          result['url'] = rule.resultTrue.url;
        }
        if (rule.resultFalse.showDetails) {
          result['exceptions'] = conditionResult.failItems;
        }
        results.push(result);
      }
    }
    return results;
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


  public getAlertsDeprecated() {
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

  public getTechAdoptionScore() {
    this.loggit.loggit('Checking Tech Adoption Score');
    let adoptionResult = {};
    adoptionResult['score'] = 0
    adoptionResult['details'] = this.checkRules(techAdoptionRules);
    for (var detail of adoptionResult['details']) {
      if (detail['score'] != undefined) {
        adoptionResult['score'] += detail['score'];
      }
    }
    return adoptionResult;
  }

  public getAlerts() {
    this.loggit.loggit('Checking Partner Alerts');
    this.loggit.loggit('Using New Rules Engine');
    return this.processRules(alertRulesNew);
  }

  public getQualityRecommendations() {
    this.loggit.loggit('Checking Quality Recommendation Rules');
 //   return this.checkRules(qualityRules);
    this.loggit.loggit('Using New Rules Engine');
    return this.processRules(qualityRules);
  };

  public getEnablementMessages() {
    this.loggit.loggit('Checking Enablement Content Rules');
    //  return this.checkRules(enablementRules)
    this.loggit.loggit('Using New Rules Engine');
    return this.processRules(enablementRules);
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
            url: ruleDef['recNeg']['url'],
            score: ruleDef['recNeg']['score']
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
              url: ruleDef['recNeg']['url'],
              score: ruleDef['recNeg']['score']
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
            url: ruleDef['recPos']['url'],
            score: ruleDef['recPos']['score']
          });
        }
      }
    }
    this.loggit.loggit('Final Recommendations: ' + JSON.stringify(recomendations));
    return recomendations;
  };

  public getCountByMetadataType2(metadataType) {
    this.loggit.loggit('getCountByMetadataType - Getting Count of Metadata by type: ' + metadataType);
    let mdDefArray = metadataType.split('.');
    let retVal = [];
    let mdCount = this.traverseMetadata(mdDefArray, this._mdInv);
    if (Array.isArray(mdCount)) {
      this.loggit.loggit('Found an Array of results. We must have passed a wildcard search');
      retVal = mdCount;
    } else {
      this.loggit.loggit('Found a single result');
      retVal.push(mdCount);
    }
    return retVal;
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
      } else retVal.push(mdCount);
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
        this.loggit.loggit('There are more components left.');
        if (mdArray.length == 1 && mdArray[0] === '*') {
          this.loggit.loggit('Last component is a wildcard. Peeking ahead');
          //Check to see if the wildcard object has any values
          if (Object.keys(mdObject[topLevel]).length == 0) {
            this.loggit.loggit(` Component ${topLevel} is an empty object. We can stop here`);
            return {
              property: topLevel,
              value: -1
            };
          } 
        }
        this.loggit.loggit('We can safely Recurse');
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
    retVal['AdoptionScore'] = this.getTechAdoptionScore();
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

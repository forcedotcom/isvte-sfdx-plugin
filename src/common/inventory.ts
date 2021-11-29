/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { incrementValue } from './JSONUtilities';
import {
  mdTypes,
  editionWarningRules,
  enablementRules,
  qualityRules,
  alertRules,
  minAPI,
  techAdoptionRules,
  dependencyRules,
  dataModels,
  standardNamespaces,
  rulesVersion
} from './rules';

//import { version } from './../../package.json';


export class packageInventory {
  private _mdInv = {};
  private _mdFullInvArray;
  private _mdMonitoredInvArray;
  private _minAPI = minAPI;
  private _enablementMessages;
  private _languageWarnings;
  private _alerts;
  private _installationWarnings;
  private _qualityRules;
  private _techAdoption;
  private _dependencies;


  public constructor() {
  };

  public setMinAPI(newAPIVersion) {
    this._minAPI = newAPIVersion;
  };

  public setMetadata(md) {
    this._mdInv = md;
    //Pre Calculate Dependencies
    //this.getDependencies();
  };


  private checkCondition(cond ) {
    let response = {
      conditionPass: false,
      passItems: [],
      failItems: []
    };
    if (!this.isConditionValid(cond)) {
      return response;
    }
      let mdTypeCount = this.getCountByMetadataType(cond.metadataType);
      if (mdTypeCount.length == 0) {
        mdTypeCount.push({
          property: cond.metadataType,
          value: -1
        });
      }
      //replace string 'minAPI' in operand with the minumum API specified
      if (Array.isArray(cond.operand)) {
        for (let i = 0; i < cond.operand.length; i++) {
          if (cond.operand[i] === 'minAPI') {
            cond.operand[i] = this._minAPI;
          }
        }
      }
      else {
        if (cond.operand === 'minAPI') {
          cond.operand = this._minAPI;
        }
      }
      let showDetails = false;
      if (cond.showDetails) {
        showDetails = true;
      }

      for (var itemCount of mdTypeCount) {
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
            itemPass = cond.operand < itemCount.value;
            break;
          case 'gte':
            itemPass = cond.operand <= itemCount.value;
            break;
          case 'lt':
            itemPass = cond.operand > itemCount.value;
            break;
          case 'lte':
            itemPass = cond.operand >= itemCount.value;
            break;
          case 'eq':
            itemPass = cond.operand == itemCount.value;
            break;
          case 'between':
            //Not inclusive
            itemPass = (cond.operand[0] > itemCount.value) && (cond.operand[1] < itemCount.value);
            break; 
        }
        if (itemPass) {
          response.conditionPass = true;
          response.passItems.push({name:itemCount.property,display:showDetails});
        } else {
          response.failItems.push({name:itemCount.property,display:showDetails});
        }
      }
      if (cond.conditionOr != undefined) {
        //By default, don't process the OR if the condition has already passed
        if (cond.conditionOr.processAlways == true || !response.conditionPass) {
          let orResponse = this.checkCondition(cond.conditionOr);
          response.conditionPass = response.conditionPass || orResponse.conditionPass;

          response.passItems.push(...orResponse.passItems);
          response.failItems.push(...orResponse.failItems);
        }
      }
      if (cond.conditionAnd != undefined) {
        //By default, don't process the AND if the condition is already false
        if (cond.conditionAnd.processAlways == true || response.conditionPass) {
          let andResponse = this.checkCondition(cond.conditionAnd);
          if (cond.conditionAnd.conditionPerItem) {
            //Condition passes if the same property passes in both this condition and in conditionAnd
            let tmpItems = [];
            for (const i of response.passItems) {
              for (const ai of andResponse.passItems) {
                if (i.name == ai.name) {
                  tmpItems.push ({name: i.name, display: i.display || ai.display});
                  break;
                }
              }
            }
            response.passItems = [...tmpItems];
            //response.passItems = response.passItems.filter(item =>andResponse.passItems.includes(item));
            //Logic correct here? Fail will return items that do not pass both conditions. Items that pass one condition but not the other are lost.
            //response.failItems = response.failItems.filter(item => andResponse.failItems.includes(item));
            tmpItems = [];
            for (const i of response.failItems) {
              for (const ai of andResponse.failItems) {
                if (i.name == ai.name) {
                  tmpItems.push ({name: i.name, display: i.display || ai.display});
                  break;
                }
              }
            }
            response.failItems = [...tmpItems];
            response.conditionPass = response.passItems.length > 0;
          } else {
            response.conditionPass = response.conditionPass && andResponse.conditionPass;
            response.passItems.push(...andResponse.passItems);
            response.failItems.push(...andResponse.failItems);
          }
        }
      }
    
    return response;
  }

  private isConditionValid(cond) {
    let isValid = true;
    let validOperators = ['always', 'never', 'exists', 'notexists', 'null', 'gt', 'gte', 'lt', 'lte', 'eq','between'];
    let operatorsNeedOperand = ['gt', 'gte', 'lt', 'lte', 'eq'];
    
    //Check Expiration
    if (cond['expiration'] != undefined) {
      const now = new Date().toJSON();
      if (cond.expiration < now) {
        isValid = false;
      }
    }
    //Cannot have both conditionAnd and conditionOr properties
    if (cond['conditionAnd'] != undefined && cond['conditionOr'] != undefined) {
      isValid = false;
    }
    //Make sure Operator is valid
    if (!validOperators.includes(cond['operator'])) {
      isValid = false;
    }
    //Make sure Operators that require a comparitor have one
    if (operatorsNeedOperand.includes(cond['operator']) && isNaN(cond['operand'])) {
      isValid = false;
    }

    //Make sure 'between' has 2 operands and that the first is the lowest
    if (cond.operator === 'between') {
      if (Array.isArray(cond.operand) && cond.operand.length == 2) {
        cond.operand.sort();
      }
      else {
        isValid = false;
      }
    }

    //We need a metadata type unless operator is always or never
    if ((cond.operator != 'always' && cond.operator != 'never') && cond.metadataType == undefined) {
      isValid = false;
    }
    return isValid;
  }


  private isRuleValid(rule) {

    return (rule['name'] != undefined &&
            rule['condition'] != undefined &&
            (rule['resultTrue'] != undefined || rule['resultFalse'] != undefined));
  }

  public getDependencies() {
    if (!this._dependencies) {
      this._dependencies = [];
     
      let dependencyRulesConstructed = [...dependencyRules];
      for (var dataModel of dataModels) {
        
        let conditions = [];
        //Check Namespaces
        if (dataModel.namespaces) {
          for (var ns of dataModel.namespaces) {
            conditions.push({
              metadataType: `dependencies.namespaces.${ns}`,
              operator: 'exists'
            });
          }
  
        }
        //Check Objects
        for (var objName of dataModel.objects) {
          //create condition for Object references in custom fields
          conditions.push({
            metadataType: `CustomField.objects.${objName}`,
            operator: 'exists'
          });
          //create condition of PBs on the object
          conditions.push({
            metadataType: `Flow.objects.${objName}`,
            operator: 'exists'
          });
          //create condition of triggers on the object
          conditions.push({
            metadataType: `ApexTrigger.objects.${objName}`,
            operator: 'exists'
          });
          //create condition of triggers on the object
          conditions.push({
            metadataType: `dependencies.components.${objName}`,
            operator: 'exists'
          });
        }
        if (conditions.length > 0) {
          let conditionConstructed = conditions.pop();
          let nextCondition;
          while (nextCondition = conditions.pop()) {
            let prevCondition = Object.assign({},conditionConstructed);
            conditionConstructed = Object.assign({},nextCondition);
            conditionConstructed['conditionOr'] = prevCondition;
          }
          let dependencyConstructed = {
            name: dataModel.name,
            label: dataModel.label,
            condition: conditionConstructed
          };
          dependencyRulesConstructed.push(dependencyConstructed) 
        }
      }
      for (var dependencyRule of dependencyRulesConstructed) {
        if (this.isConditionValid(dependencyRule.condition)) {
          if (this.checkCondition(dependencyRule.condition).conditionPass) {
            this._dependencies.push({
              name: dependencyRule.name,
              label: dependencyRule.label
            })
            incrementValue(this._mdInv,`dependencies.${dependencyRule.name}`);
          };
        }
      }

     let nameSpaces = this.getNamespaceReferences();
     if (nameSpaces.size > 0) {
       this._dependencies.push({
         name: 'namespaces',
         label: 'Namespaces:',
         items: Array.from(nameSpaces)
       });
     }
    }
    return this._dependencies;
  }

  private getNamespaceReferences() {
    let nameSpaces = new Set();
    let nameSpaceResults = this.checkCondition({metadataType:'dependencies.namespaces.*',operator:'exists'});
    for (var ns of nameSpaceResults.passItems) {
      nameSpaces.add(ns.name);
    }
    //remove standard namespaces
    for (const ns of standardNamespaces) {
      nameSpaces.delete(ns);
    }
  
    return nameSpaces;
  }


  public processRules(ruleSet) {
    //Replaces   public checkRules(ruleSet) 
    let results = [];
    for (var rule of ruleSet) {
      if (!this.isRuleValid(rule)) {
        continue;
      }
      let conditionResult = this.checkCondition(rule.condition);
      if (conditionResult.conditionPass && rule.resultTrue != undefined) {
        let result = {};
        result['label'] = rule.resultTrue.label;
        result['message'] = rule.resultTrue.message;
        if (rule.resultTrue.url != undefined) {
          result['url'] = rule.resultTrue.url;
        }
        if (rule.resultTrue.showDetails) {
         result['exceptions'] = [];
         for (const i of conditionResult.passItems) {
           if (i.display) {
             result['exceptions'].push(i.name);
           }
         }
        }
        results.push(result);
      }
      if (!conditionResult.conditionPass && rule.resultFalse != undefined) {
        let result = {};
        result['label'] = rule.resultFalse.label;
        result['message'] = rule.resultFalse.message;
        if (rule.resultFalse.url != undefined) {
          result['url'] = rule.resultFalse.url;
        }
        if (rule.resultFalse.showDetails) {
          result['exceptions'] = [];
          for (const i of conditionResult.failItems) {
            if (i.display) {
              result['exceptions'].push(i.name);
            }
          }
        }
        results.push(result);
      }
    }
    return results;
  };

  public getInstallationWarnings() {
    if (!this._installationWarnings) {
      this._installationWarnings = [];
      for (var edition of editionWarningRules) {
        let editionBlock = [];
        for (var blockingItem of edition.blockingItems) {
          let result = this.checkCondition(blockingItem.condition);
          if (result.conditionPass) {
            editionBlock.push({
              label: blockingItem.label,
  
            })
          }
        }
        if (editionBlock.length > 0) {
          this._installationWarnings.push( {
            'edition': edition.name,
            blockingItems: editionBlock
          });
        }
      }
  
    }
    return this._installationWarnings;
  };

  public getTechAdoptionScore() {
    if (!this._techAdoption) {
    this._techAdoption = [];
    for (var adoptionRule of techAdoptionRules) {
      let categoryResult = {
        categoryName: adoptionRule.categoryName,
        categoryLabel: adoptionRule.categoryLabel,
        technologies: [],
        points: 0
      };
      for (var tech of adoptionRule.technologies) {

        let techResult = {
          name: tech.name,
          question: tech.question,
          points: 0,
          maxPoints: tech.points,
          found: false,
          levelUp: undefined,
          detectable: tech.hasOwnProperty('condition')
        };

        if (techResult.detectable) {
          let conditionResult = this.checkCondition(tech.condition);
          techResult.found = conditionResult.conditionPass;
        }

        techResult.points = techResult.found ? tech.points : 0; 
        techResult.levelUp = tech.levelUp; 
  /*      if (!techResult.found && tech.levelUp != undefined) {
            techResult['levelUp'] = tech.levelUp;
        }
    */      
        categoryResult.technologies.push(techResult);
        categoryResult.points += techResult.points;
        }

        
      this._techAdoption.push(categoryResult);
    }
  }  
    return this._techAdoption;
  
  }

  public getAlerts() {
    if (!this._alerts) {
      this._alerts = this.processRules(alertRules);
    }
    return this._alerts;
  }

  public getQualityRecommendations() {
    if (!this._qualityRules) {
      this._qualityRules = this.processRules(qualityRules);
    }
    return this._qualityRules;
  };

  public getEnablementMessages() {
    if (!this._enablementMessages) {
      this._enablementMessages = this.processRules(enablementRules);
    }
    return this._enablementMessages;
  };

  public getLanguageWarnings() {
    if (!this._languageWarnings) {
      this._languageWarnings = this._mdInv['language'];
    }

    return this._languageWarnings;
  };

  public getCountByMetadataType(metadataType) {
    let mdDefArray = metadataType.split('.');
    let retVal = [];
    let mdCount = this.traverseMetadata(mdDefArray, this._mdInv);
    if (Array.isArray(mdCount)) {
      retVal = mdCount;
    } else {
      retVal.push(mdCount);
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
    let topLevel = mdArray.shift();
    if (topLevel === '*') {
      let retVal = [];

      for (var topArray in mdObject) {
        let tmpArray = [topArray, ...mdArray];
        let tmpResult = this.traverseMetadata(tmpArray, mdObject, topArray);
        if (Array.isArray(tmpResult)) {
          retVal = retVal.concat(tmpResult);
        }
        else {
          retVal.push(tmpResult);
        }
        
      }
      return retVal;
    } else if (mdObject[topLevel] != undefined) {
      if (mdArray.length > 0) {
        if (mdArray.length == 1 && mdArray[0] === '*') {
          //Check to see if the wildcard object has any values
          if (Object.keys(mdObject[topLevel]).length == 0) {
            return {
              property: topLevel,
              value: -1
            };
          }
        }
        return this.traverseMetadata(mdArray, mdObject[topLevel], wildcard);
      } else {
        let count = undefined;
        if (isNaN(mdObject[topLevel])) {
          if (mdObject[topLevel]['count'] != undefined && isFinite(mdObject[topLevel]['count'])) {
            count = mdObject[topLevel]['count'];
          } else if (mdObject[topLevel] === Object(mdObject[topLevel])) {
            count = Object.keys(mdObject[topLevel]).length;
          } else if (Array.isArray(mdObject[topLevel])) {
            count = mdObject[topLevel].length;
          }
          else {
            return {};
          }

        } else {
          count = mdObject[topLevel];
        }
        let componentName = wildcard == '' ? topLevel : wildcard;
        return {
          property: componentName,
          value: count
        };
      }

    } else {
      return {
        property: topLevel,
        value: -1
      };
    }
  };

  public getJSONOutput() {
    const date = new Date();

    let retVal = {};
    retVal['Status'] = {
      "Date": date.toUTCString(),
//      "PluginVersion": version,
      "RulesVersion": rulesVersion
    };
    retVal['MetadataInventory'] = this._mdInv;
    retVal['MonitoredItems'] = this.getMonitoredInvArray();
    retVal['Recommendations'] = this.getEnablementMessages();
    retVal['CodeQualityNotes'] = this.getQualityRecommendations();
    retVal['InstallationWarnings'] = this.getInstallationWarnings();
    retVal['Alerts'] = this.getAlerts();
    retVal['AdoptionScore'] = this.getTechAdoptionScore();
    retVal['Dependencies'] = this.getDependencies();
    retVal['LanguageWarnings'] = this.getLanguageWarnings();
    return retVal;
  };


  public getFullInvArray() {
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
    if (!this._mdMonitoredInvArray) {
      this._mdMonitoredInvArray = [];
      mdTypes.forEach(element => {
        let retObj = {};
        let extras = [];
        let extrasCustom = [];
        let extrasStandard = [];
        let count = 0;
        retObj['metadataType'] = element.metadataType;
        retObj['label'] = element.label;
        if (element.metadataType) {
          switch (String(element.metadataType)) {

            case 'CustomField':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                let standardObjFields = {
                  metadataSubType: 'StandardObjectFields',
                  label: '  Total Fields on Standard Objects',
                  'count': 0
                };
                let customObjFields = {
                  metadataSubType: 'CustomObjectFields',
                  label: '  Total Fields on Custom Objects',
                  'count': 0
                };

                for (const obj of objects) {
                  let objFieldCount = this._mdInv[element.metadataType]['objects'][obj]['count'];


                  if (this._mdInv[element.metadataType]['objects'][obj]['objectType'] === 'Custom') {
                    customObjFields['count'] += objFieldCount;
                    extrasCustom.push({
                      metadataSubType: `object.${obj}`,
                      label: `   Fields on ${obj}`,
                      'count': objFieldCount
                    });
                  } else {
                    standardObjFields['count'] += objFieldCount;
                    extrasStandard.push({
                      metadataSubType: `object.${obj}`,
                      label: `   Fields on ${obj}`,
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
                  label: '  Lighting Applications',
                  count: this._mdInv[element.metadataType]['LightingAppCount']
                });
                extras.push({
                  metadataSubType: 'LigthingConsole',
                  label: '   Lighting Consoles',
                  count: this._mdInv[element.metadataType]['LightningConsoleCount']
                });
                extras.push({
                  metadataSubType: 'ClassicApp',
                  label: '  Classic Applications',
                  count: this._mdInv[element.metadataType]['ClassicAppCount']
                });
                extras.push({
                  metadataSubType: 'ClassicConsole',
                  label: '   Classic Consoles',
                  count: this._mdInv[element.metadataType]['ClassicConsoleCount']
                });
              }
              break;
            case 'ApexClass':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'ApexFuture',
                  label: '  With Future Methods',
                  count: this._mdInv[element.metadataType]['FutureCalls']
                });
                extras.push({
                  metadataSubType: 'AuraEnabled',
                  label: '  With Aura Enabled Methods',
                  count: this._mdInv[element.metadataType]['AuraEnabledCalls']
                });
                extras.push({
                  metadataSubType: 'InvocableApex',
                  label: '  With Invocable Methods or Variables',
                  count: this._mdInv[element.metadataType]['InvocableCalls']
                });
                extras.push({
                  metadataSubType: 'BatchApex',
                  label: '  Batch Apex',
                  count: this._mdInv[element.metadataType]['BatchApex']
                });
                extras.push({
                  metadataSubType: 'ApexRest',
                  label: '  Apex REST',
                  count: this._mdInv[element.metadataType]['ApexRest']
                });
                extras.push({
                  metadataSubType: 'ApexSoap',
                  label: '  SOAP Web Services',
                  count: this._mdInv[element.metadataType]['ApexSoap']
                });
                extras.push({
                  metadataSubType: 'SchedulableApex',
                  label: '  Schedulable Apex',
                  count: this._mdInv[element.metadataType]['SchedulableApex']
                });
                extras.push({
                  metadataSubType: 'TestClasses',
                  label: '  Test Classes',
                  count: this._mdInv[element.metadataType]['TestClasses']
                });
                extras.push({
                  metadataSubType: 'CharacterCount',
                  label: '  Total Apex Characters',
                  count: this._mdInv[element.metadataType]['CharacterCount']
                });

              }
              break;
            case 'Flow':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                const flowTypes = Object.keys(this._mdInv[element.metadataType]['FlowTypes']);
                for (const flowType of flowTypes) {
                  let ftLabel;
                  const ftCount =  this._mdInv[element.metadataType]['FlowTypes'][flowType]['count'];
                  switch (flowType) {
                    case 'Flow':
                      ftLabel = '  Screen Flows';
                      break;
                    case 'AutoLaunchedFlow':
                      ftLabel = '  Autolaunched Flows';
                      break;
                    case 'Workflow':
                      ftLabel = '  Process Builder';
                      break;
                    default:
                      ftLabel = `  ${flowType}`;
                  }
                  extras.push({
                    metadataSubType: flowType,
                    label: ftLabel,
                    count: ftCount
                  });
                }
               
                const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                for (const obj of objects) {
                  let objPBTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                  extras.push({
                    metadataSubType: `object.${obj}`,
                    label: `    Process Builders on ${obj}`,
                    'count': objPBTriggerCount
                  });

                }
                extras.push({
                  metadataSubType: 'FlowTemplate',
                  label: '  Flow Templates',
                  count: this._mdInv[element.metadataType]['FlowTemplate']
                });
                const flowTemplateTypes = Object.keys(this._mdInv[element.metadataType]['FlowTemplates']);
                for (const flowTemplateType of flowTemplateTypes) {
                  let ftLabel;
                  const ftCount =  this._mdInv[element.metadataType]['FlowTemplates'][flowTemplateType]['count'];
                  switch (flowTemplateType) {
                    case 'Flow':
                      ftLabel = '    Screen Flow Templates';
                      break;
                    case 'AutoLaunchedFlow':
                      ftLabel = '    Autolaunched Flow Templates';
                      break;
                    default:
                      ftLabel = `    ${flowTemplateType}`;
                  }
                  extras.push({
                    metadataSubType: `${flowTemplateType}Template`,
                    label: ftLabel,
                    count: ftCount
                  });
                }
                
              }
              break;
            case 'ConnectedApp':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'CanvasApp',
                  label: '  Canvas Apps',
                  count: this._mdInv[element.metadataType]['CanvasApp']
                });
              }
              break;
            case 'CustomObject':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'BigObject',
                  label: '  Big Objects',
                  count: this._mdInv[element.metadataType]['BigObject']
                });
                extras.push({
                  metadataSubType: 'ExternalObject',
                  label: '  External Objects',
                  count: this._mdInv[element.metadataType]['ExternalObject']
                });


              }
              break;
            case 'ApexTrigger':
              if (this._mdInv[element.metadataType]) {
                count = this._mdInv[element.metadataType]['count'];
                extras.push({
                  metadataSubType: 'AsyncTrigger',
                  label: '  Async Triggers',
                  count: this._mdInv[element.metadataType]['AsyncTrigger']
                });
                extras.push({
                  metadataSubType: 'CharacterCount',
                  label: '  Total Apex Characters',
                  count: this._mdInv[element.metadataType]['CharacterCount']
                });
                const objects = Object.keys(this._mdInv[element.metadataType]['objects']);
                for (const obj of objects) {
                  let objTriggerCount = this._mdInv[element.metadataType]['objects'][obj]['count'];
                  extras.push({
                    metadataSubType: `object.${obj}`,
                    label: `  Triggers on ${obj}`,
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
                  label: '  Exposed Components',
                  count: this._mdInv[element.metadataType]['ExposedComponents']
                });
                
                for (var [target,targetCount] of Object.entries(this._mdInv[element.metadataType]['targets'])) {
                  let friendlyName = target.replace(/lightning(__)?/g,'');
                  extras.push({
                    metadataSubType: target,
                    label: `  ${friendlyName}`,
                    count: targetCount
                  });
                }
             
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

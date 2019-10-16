/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  flags,
  SfdxCommand
} from '@salesforce/command';
import {
  SfdxError
} from '@salesforce/core';
import {
  loggit
} from '../../common/logger';
import fs = require('fs-extra');
import xml2js = require('xml2js');
import {
  packageInventory
} from '../../common/inventory';




export default class mdscan extends SfdxCommand {

  private showFullInventory = false;
  private sourceFolder = '';
  private suppressZeroInv = false;
  private suppressAllInv = false;
  private suppressEnablement = false;
  private suppressAlerts = false;
  private suppressWarnings = false;
  private suppressQuality = false;
  private loggit;
  private packageInventory;

  public static description = 'scan a package and provide recommendations based on package inventory';

  public static examples = [
    `Scan a package and provide inventory of monitored metadata items and enablement messages:
\t$sfdx isvte:mdscan -d ./mdapi

Scan a package and provide a complete inventory of package metadata:
\t$sfdx isvte:mdscan -d ./mdapi -y

Do not display alerts and warnings:
\t$sfdx isvte:mdscan -d ./mdapi -s alerts,warnings

Display this help message:
\t$sfdx isvte:mdscan -h

For more information, please connect in the Salesforce Partner Community https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8iCAA or log an issue in github https://github.com/forcedotcom/isvte-sfdx-plugin
`
  ];


  protected static flagsConfig = {
    sourcefolder: flags.directory({
      char: 'd',
      description: 'directory containing package metadata',
      default: 'mdapiout'
    }),
    showfullinventory: flags.boolean({
      char: 'y',
      description: 'show package inventory only'
    }),
    suppress: flags.array({
      char: 's',
      description: `comma separated list of items to suppress.\n Valid options are: ZeroInventory, Inventory, Enablement, CodeQuality, Alerts, Warnings `
    }),

  };


  public async run(): Promise < any > { // tslint:disable-line:no-any

    this.loggit = new loggit('isvtePlugin');

    this.showFullInventory = this.flags.showfullinventory;
    this.sourceFolder = this.flags.sourcefolder;

    //Check Suppress Flags
    if (this.flags.suppress) {
      this.flags.suppress.forEach(element => {
        this.suppressZeroInv = this.suppressZeroInv || element.toLowerCase() == 'zeroinventory';
        this.suppressAllInv = this.suppressAllInv || element.toLowerCase() == 'inventory';
        this.suppressEnablement = this.suppressEnablement || element.toLowerCase() == 'enablement';
        this.suppressAlerts = this.suppressAlerts || element.toLowerCase() == 'alerts';
        this.suppressWarnings = this.suppressWarnings || element.toLowerCase() == 'warnings';
        this.suppressQuality = this.suppressQuality || element.toLowerCase() == 'codequality';
      });
    }

    if (!fs.existsSync(this.sourceFolder)) {
      this.loggit.loggit(`your source folder ${this.sourceFolder} doesn't exist`, 'Error');
      throw new SfdxError(`Source Folder ${this.sourceFolder} does not exist`, 'SourceNotExistError');
    }

    const packagexml = `${this.flags.sourcefolder}/package.xml`;

    let packageJSON = this.parseXML(packagexml, true);
    if (packageJSON['Package']) {
      packageJSON = packageJSON['Package'];
    } else {
      this.loggit.loggit(`Package.xml  ${packagexml} appears to be invalid `, 'Error');
      throw new SfdxError(`Package.xml  ${packagexml} appears to be invalid `, 'InvalidPackageXMLError');

    }

    this.loggit.loggit('Parsing Package');
    this.packageInventory = new packageInventory();
    this.packageInventory.setMetadata(this.inventoryPackage(packageJSON));

    if (this.showFullInventory) {
      this.ux.styledHeader('Inventory of Package:');
      this.ux.table(this.packageInventory.getFullInvArray(), ['metadataType', 'count']);
    } else {
      if (!this.suppressAllInv) {
        this.ux.styledHeader('Inventory of Package:');
        let inventoryArray = this.packageInventory.getMonitoredInvArray().filter(element => {
          return (!this.suppressZeroInv || element.count > 0);
        });
        this.ux.table(inventoryArray, ['Metadata Type', 'count']);
        this.ux.log('\n');
      }
      if (!this.suppressEnablement) {
        let recommendations = this.packageInventory.getEnablementMessages();
        if (recommendations.length > 0) {
          this.ux.styledHeader('ISV Technical Enablement:');
          for (var recommendation of recommendations) {
            if (recommendation.url != undefined) {
              this.ux.log(`${recommendation.label}:\n  ${recommendation.message}\n\tURL:${recommendation.url}\n`);
            } else {
              this.ux.log(`${recommendation.label}:\n  ${recommendation.message}\n`);
            }
          }
          this.ux.log('\n');
        }
      }

      if (!this.suppressQuality) {
        let notes = this.packageInventory.getQualityRecommendations();
        if (notes.length > 0) {
          this.ux.styledHeader('Code Quality Notes:');
          for (var note of notes) {
            this.ux.log(`${note.label}:\n  ${note.message}\n\tExceptions: ${note.exceptions.join(', ')}\n`);
          }
        }

      }
      if (!this.suppressAlerts) {
        let alerts = this.packageInventory.getAlerts();
        if (alerts.length > 0) {
          this.ux.styledHeader('Alerts:');
          for (var alert of alerts) {
            this.ux.log(`${alert.label}:\n  ${alert.message}\n\tURL:${alert.url}`);
          }
          this.ux.log('\n');
        }
      }
      if (!this.suppressWarnings) {
        this.ux.styledHeader('Installation Warnings:');
        let warnings = this.packageInventory.getInstallationWarnings();
        if (warnings.length > 0) {
          for (var warning of warnings) {
            this.ux.log(`Package cannot be installed in ${warning['edition']} due to:`)
            for (var blockingItem of warning['blockingItems']) {
              this.ux.log(`  ${blockingItem['label']} count (${blockingItem['count']}) is greater than the edition limit (${blockingItem['threshold']})`);
              if (blockingItem['requiresSR']) {
                this.ux.log('\tThis restriction is lifted when your package passes Security Review');
              }
            }
            this.ux.log('\n');
          }
        } else {
          this.ux.log('Can be installed in any Edition');
        }
      }

      // this.ux.log(this.packageInventory.getInstallationWarnings());
    }

    return this.packageInventory.getJSONOutput();

  }

  // private checkPackage(p) {

  //   this.loggit.loggit('-Getting Inventory');
  //   this.packageInventory.setMetadata(this.inventoryPackage(p));
  //  // this.packageInventory.setAPIVersion(parseFloat(p.version[0]));
  // }

  private inventoryPackage(p) {
    let types = p.types;
    let inventory = {};
    let apiVersions = {};
    let componentProperties = {};
    if (p.version) {
      apiVersions['mdapi'] = parseFloat(p.version[0]);
    }
    for (var typeIdx in types) {
      let metadataType = types[typeIdx]['name'];
      let typeInv = {};

      typeInv['index'] = typeIdx;
      typeInv['count'] = types[typeIdx]['members'].length;

      this.loggit.loggit('Checking MetadataType: ' + metadataType);
      this.loggit.loggit('  Found ' + types[typeIdx]['members'].length + ' members');
      this.loggit.loggit('Members: ' + JSON.stringify(types[typeIdx]['members']));
      //Check for wildcard members
      if (types[typeIdx]['members'].includes('*')) {
        this.loggit.loggit('Found Wildcard Members');
        types[typeIdx]['members'] = this.getMembers(types[typeIdx]);
      }
      switch (String(metadataType)) {
        case 'CustomField':
          //Do per object field counts
          let objectFields = {};

          for (var fieldIdx in types[typeIdx]['members']) {
            let fieldFullName = types[typeIdx]['members'][fieldIdx];
            let objectName = fieldFullName.split(".")[0];
            let fieldName = fieldFullName.split(".")[1];
            let objectType = 'Standard';

            this.loggit.loggit('Checking field: ' + fieldName + ' on Object: ' + objectName + ' --- ' + fieldFullName);
            if (objectName.slice(-3) == '__c' || objectName.slice(-3) == '__b') {
              objectType = 'Custom';
            }
            if (objectName.slice(-3) == '__x') {
              objectType = 'External';
            }
            if (objectFields[objectName]) {
              objectFields[objectName]['count']++
            } else {
              objectFields[objectName] = {
                'count': 1,
                'objectType': objectType
              };
            }

            //Check field descriptions
            const objectPath = `${this.flags.sourcefolder}/objects`;
            let objectXml = `${objectPath}/${objectName}.object`;
            let objectJSON = this.parseXML(objectXml);
            if (objectJSON['CustomObject'] && objectJSON['CustomObject']['fields']) {
              for (var fieldDef of objectJSON['CustomObject']['fields']) {
                if (fieldDef['fullName'] == fieldName) {
                  this.loggit.loggit('Checking Properties of Field: ' + fieldFullName);
                  if (componentProperties['CustomField'] == undefined) {
                    componentProperties['CustomField'] = {};
                  }
                  if (componentProperties['CustomField'][fieldFullName] == undefined) {
                    componentProperties['CustomField'][fieldFullName] = {};
                  }
                  componentProperties['CustomField'][fieldFullName]['descriptionExists'] = fieldDef['description'] ? 1 : 0;
                }

              }
            }

          }
          typeInv['objects'] = objectFields;

          break;
        case 'CustomObject':
          // Look for Custom Settings, External Objects,  Person Accounts, Big Objects
          this.loggit.loggit('Deep Inventory on Custom Objects');
          const objectPath = `${this.flags.sourcefolder}/objects`;
          //let xoType = {count:0};
          let xoCount = 0;
          //let boType = {count:0};
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
            let objectName = types[typeIdx]['members'][objIdx];
            this.loggit.loggit('Checking Object: ' + objectName);
            //Check external Objects
            if (objectName.slice(-3) == '__x') {
              //xoType['count']++;
              xoCount++;
            }
            //Check Big Objects
            if (objectName.slice(-3) == '__b') {
              //  boType['count']++;
              boCount++;
            }

            //Check Platform Events
            if (objectName.slice(-3) == '__e') {
              peType['count']++;
            }

            //Check Feature Management Parameters
            if (String(objectName).includes('FeatureParameter')) {
              fmType['count']++;
            }

            let objectXml = `${objectPath}/${objectName}.object`;
            let objectJSON = this.parseXML(objectXml);

            //Check Custom Settings
            if (objectJSON['CustomObject'] && objectJSON['CustomObject']['customSettingsType']) {
              csType['count']++;
            }
            //Check for Descriptions
            if (objectName.slice(-3) == '__c') {
              this.loggit.loggit('Checking properties of object ' + objectName);

              if (componentProperties['CustomObject'] == undefined) {
                componentProperties['CustomObject'] = {};
              }
              if (componentProperties['CustomObject'][objectName] == undefined) {
                componentProperties['CustomObject'][objectName] = {};
              }
              componentProperties['CustomObject'][objectName]['descriptionExists'] = objectJSON['CustomObject'] && objectJSON['CustomObject']['description'] ? 1 : 0;

            }




            //   this.loggit(objectJSON,'JSON');
          }
          //inventory['ExternalObject__c'] = xoType;
          //inventory['BigObject__c'] = boType;

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
          //Check for Flow Templates

          this.loggit.loggit('Checking flows');
          // let flowTemplate = {count:0};

          // const flowPath = `${this.flags.sourcefolder}/flows`;
          // for (var flowIdx in types[typeIdx]['members']) {
          //   let flowName = types[typeIdx]['members'][flowIdx];
          //   let flowXml = `${flowPath}/${flowName}.flow`;
          //   let flowJSON = this.parseXML(flowXml)['Flow'];
          //   if (flowJSON['isTemplate'] && flowJSON['isTemplate'][0] === 'true') {
          //     flowTemplate['count']++;
          //   }
          // }
          // inventory['FlowTemplate__c'] = flowTemplate;
          let templateCount = 0;
          let screenTemplateCount = 0;
          let autolaunchedTemplateCount = 0;
          let objects = {};
          //let autolaunchCount = 0;
          //let processBuilderCount = 0;
          //let screenFlowCount = 0;
          const flowPath = `${this.flags.sourcefolder}/flows`;
          for (var flowIdx in types[typeIdx]['members']) {
            let flowName = types[typeIdx]['members'][flowIdx];
            let flowXml = `${flowPath}/${flowName}.flow`;
            let flowJSON = this.parseXML(flowXml);
            this.loggit.loggit('Checking file:' + flowXml);
            if (flowJSON['Flow'] && flowJSON['Flow']['isTemplate'] && flowJSON['Flow']['isTemplate'][0] === 'true') {
              templateCount++;
              if (flowJSON['Flow']['processType'] && flowJSON['Flow']['processType'] == 'Flow') {
                screenTemplateCount++;
              }
              if (flowJSON['Flow']['processType'] && flowJSON['Flow']['processType'] == 'AutoLaunchedFlow') {
                autolaunchedTemplateCount++;
              }
            }
            if (flowJSON['Flow'] && flowJSON['Flow']['processType']) {
              this.loggit.loggit('Flow Type:' + flowJSON['Flow']['processType']);
              if (typeInv[flowJSON['Flow']['processType']]) {
                typeInv[flowJSON['Flow']['processType']]++;

              } else {
                typeInv[flowJSON['Flow']['processType']] = 1;
              }
              //this.loggit('Flow Type:' + flowJSON['Flow']['processType']);
              if (flowJSON['Flow']['processType'] == 'Workflow') {
                //Do per object Inventory of PB
                this.loggit.loggit('Process Builder -- Inventorying Triggers Per Object');
                this.loggit.loggit('Flow Details: ' + JSON.stringify(flowJSON['Flow']['processMetadataValues']));
                for (var processMetadataValue of flowJSON['Flow']['processMetadataValues']) {
                  this.loggit.loggit('Metadata Value Name: ' + processMetadataValue['name']);
                  if (processMetadataValue['name'] == 'ObjectType') {
                    this.loggit.loggit('ObjectName:' + JSON.stringify(processMetadataValue['value'][0]));
                    let objectName = processMetadataValue['value'][0]['stringValue'][0];
                    this.loggit.loggit('Extracted Object Name:' + objectName);
                    if (objects[objectName]) {
                      objects[objectName]['count']++;
                    } else {
                      objects[objectName] = {
                        count: 1
                      };
                    }
                  }
                }
              }
            }
          }
          typeInv['Flow'] = typeInv['Flow'] ? typeInv['Flow'] : 0;
          typeInv['AutoLaunchedFlow'] = typeInv['AutoLaunchedFlow'] ? typeInv['AutoLaunchedFlow'] : 0;
          typeInv['Workflow'] = typeInv['Workflow'] ? typeInv['Workflow'] : 0;
          typeInv['FlowTemplate'] = templateCount;
          typeInv['ScreenFlowTemplate'] = screenTemplateCount;
          typeInv['AutoLaunchedFlowTemplate'] = autolaunchedTemplateCount;
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
            this.loggit.loggit('Checking App: ' + appName);
            const appPath = `${this.flags.sourcefolder}/applications`;
            let appXml = `${appPath}/${appName}.app`;
            let appJSON = this.parseXML(appXml);
            if (appJSON['CustomApplication']) {
              if (appJSON['CustomApplication']['uiType']) {
                uiType = appJSON['CustomApplication']['uiType'][0];
              }
              if (appJSON['CustomApplication']['navType']) {
                navType = appJSON['CustomApplication']['navType'][0];
              }
              if (uiType === 'Lightning') {
                lightningCount++;
                if (navType === 'Console') {
                  lightingConsoleCount++;
                }
              } else if (uiType === 'Aloha') {
                classicCount++;
                if (navType === 'Console') {
                  classicConsoleCount++;
                }
              }
              //<uiType>Lightning</uiType>
              //<navType>Console</navType>
            }
          }
          typeInv['LightingAppCount'] = lightningCount;
          typeInv['LightningConsoleCount'] = lightingConsoleCount;
          typeInv['ClassicAppCount'] = classicCount;
          typeInv['ClassicConsoleCount'] = classicConsoleCount;
          break;
        case 'ConnectedApp':
          this.loggit.loggit('Checking Connected Apps');

          let canvasCount = 0;

          const caPath = `${this.flags.sourcefolder}/connectedApps`;
          for (var caIdx in types[typeIdx]['members']) {
            let caName = types[typeIdx]['members'][caIdx];
            let caXml = `${caPath}/${caName}.connectedApp`;
            let caJSON = this.parseXML(caXml);
            if (caJSON['ConnectedApp'] && caJSON['ConnectedApp']['canvasConfig']) {
              canvasCount++;
            }
          }
          typeInv['CanvasApp'] = canvasCount;
          break;
        case 'ApexClass':
          this.loggit.loggit('Interrogating Apex');
          let futureCount = 0;
          // let testCount = 0;
          let auraEnabledCount = 0;
          let batchCount = 0;
          let schedulableCount = 0;
          let invocableCount = 0;
          let apexRestCount = 0;
          let apexSoapCount = 0;

          const apexPath = `${this.flags.sourcefolder}/classes`;
          for (var apxIdx in types[typeIdx]['members']) {
            let className = types[typeIdx]['members'][apxIdx];
            let classFile = `${apexPath}/${className}.cls`;

            if (fs.existsSync(classFile)) {

              let classBody = fs.readFileSync(classFile, 'utf8');
              // this.loggit(classBody);
              //const testReg = /@istest/ig;
              const futureReg = /@future/ig;
              const auraEnabledReg = /@AuraEnabled/ig;
              const invocableReg = /@InvocableMethod|InvocableVariable/ig;
              const batchReg = /implements\s+Database\.Batchable/ig;
              const scheduleReg = /implements\s+Schedulable/ig;
              const restReg = /@RestResource/ig;
              const soapReg = /webservice\s+static/ig;


              //  if (testReg.test(classBody)) {
              //    testCount++;
              //  }
              if (futureReg.test(classBody)) {
                futureCount++;
              }
              if (auraEnabledReg.test(classBody)) {
                auraEnabledCount++;
              }
              if (invocableReg.test(classBody)) {
                invocableCount++;
              }
              if (restReg.test(classBody)) {
                apexRestCount++;
              }
              if (soapReg.test(classBody)) {
                apexSoapCount++;
              }
              if (scheduleReg.test(classBody)) {
                schedulableCount++;
              }
              if (batchReg.test(classBody)) {
                batchCount++;
              }
              //batchCount += ((classBody || '').match(batchReg) || []).length;
            }

            let classMetaFile = `${apexPath}/${className}.cls-meta.xml`;
            if (fs.existsSync(classMetaFile)) {
              let classMetaJSON = this.parseXML(classMetaFile);
              if (classMetaJSON['ApexClass'] && classMetaJSON['ApexClass']['apiVersion']) {
                if (apiVersions['ApexClass'] == undefined) {
                  apiVersions['ApexClass'] = {};
                }
                apiVersions['ApexClass'][className] = parseFloat(classMetaJSON['ApexClass']['apiVersion'][0]);
              }
            }
          }
          typeInv['FutureCalls'] = futureCount;
          typeInv['AuraEnabledCalls'] = auraEnabledCount;
          typeInv['InvocableCalls'] = invocableCount;
          // typeInv['TestMethods'] = testCount;
          typeInv['BatchApex'] = batchCount;
          typeInv['SchedulableApex'] = schedulableCount;
          typeInv['ApexRest'] = apexRestCount;
          typeInv['ApexSoap'] = apexSoapCount;


          break;
        case 'ApexTrigger':
          this.loggit.loggit('Interrogating Trigger');
          let triggerInv = {};
          //let asyncTrigger = {'count':0};
          let asyncCount = 0;
          const triggerPath = `${this.flags.sourcefolder}/triggers`;
          for (var triggerIdx in types[typeIdx]['members']) {
            let triggerName = types[typeIdx]['members'][triggerIdx];
            let triggerFile = `${triggerPath}/${triggerName}.trigger`;
            let triggerBody = fs.readFileSync(triggerFile, 'utf8');
            const triggerDetailReg = /trigger\s+(\w+)\s+on\s+(\w+)\s*\((.+)\)/im;
            let triggerDetail = triggerDetailReg.exec(triggerBody);
            let triggerObj = triggerDetail[2];
            let triggerType = triggerDetail[3];
            this.loggit.loggit('Trigger Name:' + triggerName);
            this.loggit.loggit('Trigger Object:' + triggerObj);
            this.loggit.loggit('Trigger Type: ' + triggerType);
            if (triggerObj.slice(-11).toLowerCase() === 'changeevent') {
              //  asyncTrigger['count']++;
              asyncCount++;
            }
            if (triggerInv[triggerObj]) {
              triggerInv[triggerObj]['count']++;
            } else {
              triggerInv[triggerObj] = {
                count: 1
              };
            }
            let triggerMetaFile = `${triggerPath}/${triggerName}.trigger-meta.xml`;
            if (fs.existsSync(triggerMetaFile)) {
              let triggerMetaJSON = this.parseXML(triggerMetaFile);
              if (triggerMetaJSON['ApexTrigger'] && triggerMetaJSON['ApexTrigger']['apiVersion']) {

                if (apiVersions['ApexTrigger'] == undefined) {
                  apiVersions['ApexTrigger'] = {};
                }
                apiVersions['ApexTrigger'][triggerName] = parseFloat(triggerMetaJSON['ApexTrigger']['apiVersion'][0]);
              }
            }
          }
          //  this.loggit(triggerInv,'JSON');
          typeInv['objects'] = triggerInv;
          typeInv['AsyncTrigger'] = asyncCount;
          //inventory['AsyncTrigger__c'] = asyncTrigger;

          break;
        case 'LightningComponentBundle':
          this.loggit.loggit('Interrogating LWC');
          const lwcPath = `${this.flags.sourcefolder}/lwc`;
          let exposedCount = 0;
          let appPageCount = 0;
          let recordPageCount = 0;
          let homePageCount = 0;
          let flowScreenCount = 0;

          for (var lwcIdx in types[typeIdx]['members']) {
            const lwcName = types[typeIdx]['members'][lwcIdx];
            const lwcXml = `${lwcPath}/${lwcName}/${lwcName}.js-meta.xml`;
            let lwcJSON = this.parseXML(lwcXml);
            if (lwcJSON['LightningComponentBundle']) {
              lwcJSON = lwcJSON['LightningComponentBundle'];

              this.loggit.loggit('Checking LWC ' + lwcName);
              // this.loggit(lwcJSON,'JSON');
              if (lwcJSON['apiVersion']) {
                if (apiVersions['LightningComponentBundle'] == undefined) {
                  apiVersions['LightningComponentBundle'] = {};
                }
                apiVersions['LightningComponentBundle'][lwcName] = parseFloat(lwcJSON['apiVersion'][0]);
              }
              if (lwcJSON['isExposed'] && lwcJSON['isExposed'][0] === 'true') {
                exposedCount++;
              }
              if (lwcJSON['targets'] && lwcJSON['targets'][0]['target']) {
                this.loggit.loggit('Checking Targets');
                this.loggit.loggit(lwcJSON['targets'][0]);
                for (let target of lwcJSON['targets'][0]['target']) {
                  if (target === 'lightning__RecordPage') {
                    recordPageCount++;
                  }
                  if (target === 'lightning__AppPage') {
                    appPageCount++;
                  }
                  if (target === 'lightning__HomePage') {
                    homePageCount++;
                  }
                  if (target === 'lightning__FlowScreen') {
                    flowScreenCount++;
                  }
                }
              }
            }
          }
          typeInv['ExposedComponents'] = exposedCount;
          typeInv['RecordPageComponents'] = recordPageCount;
          typeInv['AppPageComponents'] = appPageCount;
          typeInv['HomePageComponents'] = homePageCount;
          typeInv['FlowScreenComponents'] = flowScreenCount;

          break;
        case 'AuraDefinitionBundle':
          this.loggit.loggit('Interrogating Aura Components');
          const auraPath = `${this.flags.sourcefolder}/aura`;
          for (var auraIdx in types[typeIdx]['members']) {
            const auraName = types[typeIdx]['members'][auraIdx];
            const auraXml = `${auraPath}/${auraName}/${auraName}.cmp-meta.xml`;
            let auraJSON = this.parseXML(auraXml);
            this.loggit.loggit('Checking Aura Component ' + auraName);
            if (auraJSON['AuraDefinitionBundle'] && auraJSON['AuraDefinitionBundle']['apiVersion']) {
              if (apiVersions['AuraDefinitionBundle'] == undefined) {
                apiVersions['AuraDefinitionBundle'] = {};
              }
              apiVersions['AuraDefinitionBundle'][auraName] = parseFloat(auraJSON['AuraDefinitionBundle']['apiVersion'][0]);
            }
          }
          break;
      }

      inventory[metadataType] = typeInv;
    }

    //Check Person Accounts
    let pafile = `${this.flags.sourcefolder}/objects/PersonAccount.object`;
    //let paType = {
    //  count: 0
    //};

    if (fs.existsSync(pafile)) {
      //paType['count'] = 1;
      inventory['PersonAccount__c'] = {
        count: 1
      };
    }
    //Add Version Info
    inventory['apiVersions'] = apiVersions;
    inventory['componentProperties'] = componentProperties;
    return inventory;
  }

  private getMembers(mdTypeDef) {
    this.loggit.loggit('Getting wildcard members')
    //  this.loggit(mdTypeDef, 'json');
    switch (String(mdTypeDef['name'])) {
      case 'ApexClass':
        return this.getMembersFromFiles('classes', 'cls');
      case 'CustomObject':
        return this.getMembersFromFiles('objects', 'object');
      case 'CustomObject':
        return this.getMembersFromFiles('objects', 'object');
      case 'CustomObject':
        return this.getMembersFromFiles('objects', 'object');
      default:
        return mdTypeDef['members'];
    }
  }

  private getMembersFromFiles(folder, extension) {
    const typePath = `${this.flags.sourcefolder}/${folder}`;
    const members = [];
    if (!fs.existsSync(typePath)) {
      this.loggit.loggit(`Folder ${typePath} does not exist. Cannot find members`);
      return members;
    }
    this.loggit.loggit(`Looking in folder ${typePath} for members`);
    const folderContents = fs.readdirSync(typePath);
    this.loggit.loggit('Folder Contents: ' + JSON.stringify(folderContents));
    folderContents.forEach(element => {

      const [fileName, ext] = [element.substr(0, element.lastIndexOf('.')), element.substr(element.lastIndexOf('.') + 1, element.length)]
      if (ext === extension) {
        members.push(fileName);
      }
      return members;
    });

    this.loggit.loggit('Found Members: ' + JSON.stringify(members));
  }

  private parseXML(xmlfile, dieOnError = false) {
    const parser = new xml2js.Parser({
      attrkey: 'ATTR'
    });
    let json = [];
    let error = undefined;

    if (!fs.existsSync(xmlfile)) {
      let message = `Cannot find XML File: ${xmlfile}`;
      if (dieOnError) {
        this.loggit.loggit(message, 'Error');
        throw new SfdxError(message, 'XMLNotFoundError');
      } else {
        this.loggit.loggit(message, 'Warn');
        return json;
      }
    }

    let xmlData = fs.readFileSync(xmlfile, 'ascii');
    parser.parseString(xmlData.substring(0, xmlData.length), function (err, result) {
      error = err;
      json = result;
    });

    if (error) {
      this.loggit.loggit(`Error parsing ${xmlfile}: ${error}`, 'Error');
      throw new SfdxError(`Error parsing ${xmlfile}: ${error}`, 'XMLParseError');
    }
    return json;
  }

  // private loggit(logMessage, type = '') {
  //   switch(type) { 
  //     case 'Error': { 
  //       this.isvteLogger.error(logMessage);
  //        break; 
  //     } 
  //     case 'Warn': {
  //       this.isvteLogger.warn(logMessage);
  //       break;
  //     }
  //     default: { 
  //       this.isvteLogger.debug(logMessage);
  //       break; 
  //     } 
  //  } 
  // }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  flags,
  SfdxCommand,
  TableOptions
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
import {
  minAPI
} from '../../common/rules';
import {
  mdmap
} from '../../common/mdmap';
import *
  as util
  from 'util'
import MetadataFilterFromPackageXml
  from 'sfdx-essentials/lib/commands/essentials/metadata/filter-from-packagexml';

export default class mdscan extends SfdxCommand {

  private showFullInventory = false;
  private showTechAdoption = false;
  private sourceFolder = '';
  private sfdxPackageXml: string;
  private suppressZeroInv = false;
  private suppressAllInv = false;
  private suppressEnablement = false;
  private suppressAlerts = false;
  private suppressWarnings = false;
  private suppressQuality = false;
  private suppressAPI = false;
  // private suppressAdoptionScore = false;
  private loggit;
  private packageInventory;
  private sfdxConvertFolder = './tmp/mdapi';
  private sfdxConvertFolderFilter = './tmp/mdapiFiltered';

  public static description = 'scan a package and provide recommendations based on package inventory';

  public static examples = [
    `Scan a package and provide inventory of monitored metadata items and enablement messages:
\t$sfdx isvte:mdscan -d ./mdapi

Scan a package using a SFDX project and a package.xml file:
\t$sfdx isvte:mdscan -d ./force-app/main/default -p ./config/package.xml

Scan a package and provide a complete inventory of package metadata:
\t$sfdx isvte:mdscan -d ./mdapi -y

Do not display alerts and warnings:
\t$sfdx isvte:mdscan -d ./mdapi -s alerts,warnings

Display this help message:
\t$sfdx isvte:mdscan -h

For more information, please connect in the ISV Technical Enablement Plugin
 Chatter group on the Salesforce Partner Community https://partners.salesforce.com/0F93A0000004mWj or log an issue in github https://github.com/forcedotcom/isvte-sfdx-plugin
`
  ];


  protected static flagsConfig = {
    sourcefolder: flags.directory({
      char: 'd',
      description: 'directory containing package metadata',
      default: 'mdapiout'
    }),
    sfdxpackagexml: flags.string({
      char: 'p',
      description: 'path to a package.xml file if current folder is a SFDX Project'
    }),
    showfullinventory: flags.boolean({
      char: 'y',
      description: 'show package inventory only'
    }),
    suppress: flags.array({
      char: 's',
      description: `comma separated list of items to suppress.\n Valid options are: ZeroInventory, Inventory, Enablement, Quality, Alerts, Warnings, API`
    }),
    techadoption: flags.boolean({
      char: 't',
      description: `Show Tech Adoption calculation for Trailblazer scoring`
    }),
    minapi: flags.integer({
      description: 'minimum api version to use during quality checks',
      default: minAPI
    })

  };


  public async run(): Promise<any> { // tslint:disable-line:no-any

    this.loggit = new loggit('isvtePlugin');

    this.showFullInventory = this.flags.showfullinventory;
    this.sourceFolder = this.flags.sourcefolder;
    this.showTechAdoption = this.flags.techadoption;
    this.sfdxPackageXml = this.flags.sfdxpackagexml;

    //Check Suppress Flags
    if (this.flags.suppress) {
      this.flags.suppress.forEach(element => {
        this.suppressZeroInv = this.suppressZeroInv || element.toLowerCase() == 'zeroinventory';
        this.suppressAllInv = this.suppressAllInv || element.toLowerCase() == 'inventory';
        this.suppressEnablement = this.suppressEnablement || element.toLowerCase() == 'enablement';
        this.suppressAlerts = this.suppressAlerts || element.toLowerCase() == 'alerts';
        this.suppressWarnings = this.suppressWarnings || element.toLowerCase() == 'warnings';
        this.suppressQuality = this.suppressQuality || element.toLowerCase() == 'quality';
        this.suppressAPI = this.suppressAPI || element.toLowerCase() == 'api';
        //      this.suppressAdoptionScore = this.suppressAdoptionScore || element.toLowerCase() == 'readoption'
      });
    }

    if (!fs.existsSync(this.sourceFolder)) {
      this.loggit.loggit(`your source folder ${this.sourceFolder} doesn't exist`, 'Error');
      throw new SfdxError(`Source Folder ${this.sourceFolder} does not exist`, 'SourceNotExistError');
    }

    // If argument packageXml is sent, convert SFDX project into metadatas folder then filter it 
    if (this.sfdxPackageXml) {
      const exec = util.promisify(require('child_process').exec);

      try {
        // force:source:convert in a temporary folder
        const sfdxConvertCommand = `sfdx force:source:convert -d ${this.sfdxConvertFolder} -r ${(this.sourceFolder != mdscan.flagsConfig.sourcefolder.default) ? this.sourceFolder : '.'}`;
        this.loggit.loggit(`Converting ${this.sourceFolder} into metadata...`);
        const { stderr } = await exec(sfdxConvertCommand);
        if (stderr) {
          throw new SfdxError(`Unable to convert ${this.sourceFolder} to metadatas`, 'ConversionToMetadataError');
        }
        else {
          this.loggit.loggit(`Converted ${this.sourceFolder} into metadata`);
        }

        // Filter metadatas folder using package.xml
        await MetadataFilterFromPackageXml.run([
          '-i', this.sfdxConvertFolder,
          '-o', this.sfdxConvertFolderFilter,
          '-p', this.sfdxPackageXml,
          '-s']);
        this.sourceFolder = this.sfdxConvertFolderFilter; // Set filtered mdapi folder as sourceFolder 
      }
      catch (e) {
        throw e;
      }
      // Remove filtered metadata folder if existing
      if (fs.existsSync(this.sfdxConvertFolder)) {
        fs.removeSync(this.sfdxConvertFolder);
      }
    }

    // Process MD Scan

    const packagexml = `${this.sourceFolder}/package.xml`;

    let packageJSON = this.parseXML(packagexml, true);
    if (packageJSON['Package']) {
      packageJSON = packageJSON['Package'];
    } else {
      this.loggit.loggit(`Package.xml  ${packagexml} appears to be invalid `, 'Error');
      throw new SfdxError(`Package.xml  ${packagexml} appears to be invalid `, 'InvalidPackageXMLError');

    }

    this.loggit.loggit('Parsing Package');
    this.packageInventory = new packageInventory();

    if (this.flags.minapi) {
      this.loggit.loggit(`Setting Minimum API version for quality checks to ${this.flags.minapi}`);
      this.packageInventory.setMinAPI(this.flags.minapi);
    }

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
        const inventoryTableoptions: TableOptions = { columns: [{ key: 'label', label: 'Metadata Type' }, { key: 'count', label: 'Count' }] };
        this.ux.table(inventoryArray, inventoryTableoptions);
        this.ux.log('\n');
      }


      if (!this.suppressEnablement) {
        let recommendations = this.packageInventory.getEnablementMessages();
        if (recommendations.length > 0) {
          this.ux.styledHeader('Best Practices and Feature Recommendations:');
          for (var recommendation of recommendations) {
            let message = `${recommendation.label}:\n${recommendation.message}\n`;
            if (recommendation.url != undefined) {
              message += `URL:${recommendation.url}\n`;
            }
            if (recommendation.exceptions != undefined && recommendation.exceptions.length > 0) {
              message += `Components: ${recommendation.exceptions.join(', ')}\n`;
            }
            this.ux.log(message);
          }
        }

      }

      if (!this.suppressQuality) {
        //TODO: suppress API is not used
        let recommendations = this.packageInventory.getQualityRecommendations();
        if (recommendations.length > 0) {
          this.ux.styledHeader('Quality Rules:');
          for (var recommendation of recommendations) {
            let message = `${recommendation.label}:\n${recommendation.message}\n`;
            if (recommendation.url != undefined) {
              message += `URL:${recommendation.url}\n`;
            }
            if (recommendation.exceptions != undefined && recommendation.exceptions.length > 0) {
              message += `Components: ${recommendation.exceptions.join(', ')}\n`;
            }
            this.ux.log(message);
          }
        }

      }
      if (!this.suppressAlerts) {
        let recommendations = this.packageInventory.getAlerts();
        if (recommendations.length > 0) {
          this.ux.styledHeader('Partner Alerts:');
          for (var recommendation of recommendations) {
            let message = `${recommendation.label}:\n${recommendation.message}\n`;
            if (recommendation.url != undefined) {
              message += `URL:${recommendation.url}\n`;
            }
            if (recommendation.exceptions != undefined && recommendation.exceptions.length > 0) {
              message += `Components: ${recommendation.exceptions.join(', ')}\n`;
            }
            this.ux.log(message);
          }
        }

      }
      if (!this.suppressWarnings) {
        this.ux.styledHeader('Installation Warnings');
        let warnings = this.packageInventory.getInstallationWarnings();
        if (warnings.length > 0) {
          for (var warning of warnings) {
            this.ux.log(`Package cannot be installed in ${warning['edition']} due to:`)
            for (var blockingItem of warning['blockingItems']) {
              this.ux.log(`  ${blockingItem['label']} `);
            }
            this.ux.log('\n');
          }
        } else {
          this.ux.log('Can be installed in any Edition\n');
        }

        let dependencies = this.packageInventory.getDependencies();
        if (dependencies.length > 0) {
          this.ux.log('Feature and License Dependencies:');
          for (var dependency of dependencies) {
            this.ux.log(`  ${dependency.label}`);
          }
          this.ux.log('\n');
        }
      }

      if (this.showTechAdoption) {
        this.ux.styledHeader('Technology Adoption:');
        for (var category of this.packageInventory.getTechAdoptionScore()) {
          this.ux.log(`${category.categoryLabel}\n`);
          for (var item of category.items) {
            this.ux.log(`   ${item.label}: ${item.isIncluded ? 'Found' : 'Not Found'}`)
          }
          this.ux.log('\n');
        }
      }

    }

    // Get MdScan JSON Output
    const outputRes = this.packageInventory.getJSONOutput();

    // Remove filtered metadata folder if existing
    if (fs.existsSync(this.sfdxConvertFolderFilter)) {
      fs.removeSync(this.sfdxConvertFolderFilter);
    }

    return outputRes;

  }

  private inventoryPackage(p) {
    let types = p.types;
    let inventory = {};
    let apiVersions = {};
    let componentProperties = {};
    let dependencies = {};
    if (p.version) {
      apiVersions['mdapi'] = parseFloat(p.version[0]);
    }
    for (var typeIdx in types) {
      let metadataType = types[typeIdx]['name'];
      let typeInv = {};

      typeInv['index'] = typeIdx;

      this.loggit.loggit('Checking MetadataType: ' + metadataType);

      //Check for wildcard members
      if (types[typeIdx]['members'].includes('*')) {
        this.loggit.loggit('Found Wildcard Members');
        types[typeIdx]['members'] = this.getMembers(types[typeIdx]);
        //        this.loggit.loggit('Members: ' + JSON.stringify(types[typeIdx]['members']));
      }
      typeInv['count'] = types[typeIdx]['members'].length;

      this.loggit.loggit('  Found ' + types[typeIdx]['members'].length + ' members');
      this.loggit.loggit('Members: ' + JSON.stringify(types[typeIdx]['members']));

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
              objectFields[objectName]['count'] += 1;
            } else {
              objectFields[objectName] = {
                'count': 1,
                'objectType': objectType
              };
            }

            //Check field descriptions
            //Only check custom fields or standard fields on custom objects, not standard
            if (objectType == 'Custom' || objectType == 'External' || fieldName.slice(-3) == '__c') {
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
              xoCount += 1;
            }
            //Check Big Objects
            if (objectName.slice(-3) == '__b') {
              //  boType['count']++;
              boCount += 1;
            }

            //Check Platform Events
            if (objectName.slice(-3) == '__e') {
              peType['count'] += 1;
            }

            //Check Feature Management Parameters
            if (String(objectName).includes('FeatureParameter')) {
              fmType['count'] += 1;
            }

            let objectXml = `${objectPath}/${objectName}.object`;
            let objectJSON = this.parseXML(objectXml);

            //Check Custom Settings
            if (objectJSON['CustomObject'] && objectJSON['CustomObject']['customSettingsType']) {
              csType['count'] + 1;
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

          let templateCount = 0;
          let screenTemplateCount = 0;
          let autolaunchedTemplateCount = 0;
          let objects = {};

          const flowPath = `${this.flags.sourcefolder}/flows`;
          for (var flowIdx in types[typeIdx]['members']) {
            let flowName = types[typeIdx]['members'][flowIdx];
            let flowXml = `${flowPath}/${flowName}.flow`;
            let flowJSON = this.parseXML(flowXml);
            this.loggit.loggit('Checking file:' + flowXml);
            if (flowJSON['Flow'] && flowJSON['Flow']['isTemplate'] && flowJSON['Flow']['isTemplate'][0] === 'true') {
              templateCount += 1;
              if (flowJSON['Flow']['processType'] && flowJSON['Flow']['processType'] == 'Flow') {
                screenTemplateCount += 1;
              }
              if (flowJSON['Flow']['processType'] && flowJSON['Flow']['processType'] == 'AutoLaunchedFlow') {
                autolaunchedTemplateCount += 1;
              }
            }
            if (flowJSON['Flow'] && flowJSON['Flow']['processType']) {
              this.loggit.loggit('Flow Type:' + flowJSON['Flow']['processType']);
              if (typeInv[flowJSON['Flow']['processType']]) {
                typeInv[flowJSON['Flow']['processType']] += 1;

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
                      objects[objectName]['count'] += 1;
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
          this.loggit.loggit('Checking Connected Apps');

          let canvasCount = 0;

          const caPath = `${this.flags.sourcefolder}/connectedApps`;
          for (var caIdx in types[typeIdx]['members']) {
            let caName = types[typeIdx]['members'][caIdx];
            let caXml = `${caPath}/${caName}.connectedApp`;
            let caJSON = this.parseXML(caXml);
            if (caJSON['ConnectedApp'] && caJSON['ConnectedApp']['canvasConfig']) {
              canvasCount += 1;
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
              const advFLSSOQLReg = /SECURITY_ENFORCED/ig;
              const advFLSStripInaccessible = /Security\.stripInaccessible/ig;
            //  const refersGuestSimpleReg = /UserType(?:\(\))?\s*=\s*(['"])Guest\1/ig;
            //  const refersGuestComplexReg = /(\w+)\s*=.*getUserType\(\)(?:.*)\1\s*=\s*(["'])Guest\2/is;
              const refersGuestTrivialReg = /(["'])Guest\1/ig;

              //  if (testReg.test(classBody)) {
              //    testCount++;
              //  }
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
                if (componentProperties['ApexClass'] == undefined) {
                  componentProperties['ApexClass'] = {};
                }
                if (componentProperties['ApexClass'][className] == undefined) {
                  componentProperties['ApexClass'][className] = {};
                }
                componentProperties['ApexClass'][className]['SECURITY_ENFORCED'] = 1;
              }
              if (advFLSStripInaccessible.test(classBody)) {
                if (componentProperties['ApexClass'] == undefined) {
                  componentProperties['ApexClass'] = {};
                }
                if (componentProperties['ApexClass'][className] == undefined) {
                  componentProperties['ApexClass'][className] = {};
                }
                componentProperties['ApexClass'][className]['StripInaccessible'] = 1;
              }

          //    if (refersGuestComplexReg.test(classBody) || refersGuestSimpleReg.test(classBody)) {
              if (refersGuestTrivialReg.test(classBody)) {
                if (componentProperties['ApexClass'] == undefined) {
                  componentProperties['ApexClass'] = {};
                }
                if (componentProperties['ApexClass'][className] == undefined) {
                  componentProperties['ApexClass'][className] = {};
                }
                componentProperties['ApexClass'][className]['RefersToGuest'] = 1;
              }

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
            const refersGuestTrivialReg = /(["'])Guest\1/ig;


            let triggerDetail = triggerDetailReg.exec(triggerBody);
            if (triggerDetail == null) {
              this.loggit.loggit('Could not parse Trigger File: ' + triggerFile);
            }
            else {
              let triggerObj = triggerDetail[2];
              let triggerType = triggerDetail[3];
              this.loggit.loggit('Trigger Name:' + triggerName);
              this.loggit.loggit('Trigger Object:' + triggerObj);
              this.loggit.loggit('Trigger Type: ' + triggerType);
              if (triggerObj.slice(-11).toLowerCase() === 'changeevent') {
                //  asyncTrigger['count']++;
                asyncCount += 1;
              }
              if (triggerInv[triggerObj]) {
                triggerInv[triggerObj]['count'] += 1;
              } else {
                triggerInv[triggerObj] = {
                  count: 1
                };
              }
              if (refersGuestTrivialReg.test(triggerBody)) {
                if (componentProperties['ApexTrigger'] == undefined) {
                  componentProperties['ApexTrigger'] = {};
                }
                if (componentProperties['ApexTrigger'][triggerName] == undefined) {
                  componentProperties['ApexTrigger'][triggerName] = {};
                }
                componentProperties['ApexTrigger'][triggerName]['RefersToGuest'] = 1;
              }

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
          typeInv['objects'] = triggerInv;
          typeInv['AsyncTrigger'] = asyncCount;
          break;
        case 'LightningComponentBundle':
          this.loggit.loggit('Interrogating LWC');
          const lwcPath = `${this.flags.sourcefolder}/lwc`;
          let exposedCount = 0;
          let targets = {}


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
                exposedCount += 1;
              }
              if (lwcJSON['targets'] && lwcJSON['targets'][0]['target']) {
                this.loggit.loggit('Checking Targets');
                this.loggit.loggit(lwcJSON['targets'][0]);
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
          }
          typeInv['ExposedComponents'] = exposedCount;
          typeInv['targets'] = targets;

          break;
        case 'ApexPage':
          this.loggit.loggit('Interrogating Visualforce');
          const vfPath = `${this.flags.sourcefolder}/pages`;
          for (var vfIdx in types[typeIdx]['members']) {
            const vfName =  types[typeIdx]['members'][vfIdx];
            const vfFile = `${vfPath}/${vfName}.page`;
            const vfXML = `${vfPath}/${vfName}.page-meta.xml`;
            if (fs.existsSync(vfXML)) {
              let vfMetaJSON = this.parseXML(vfXML);
              if (vfMetaJSON['ApexPage'] && vfMetaJSON['ApexPage']['apiVersion']) {

                if (apiVersions['ApexPage'] == undefined) {
                  apiVersions['ApexPage'] = {};
                }
                apiVersions['ApexPage'][vfName] = parseFloat(vfMetaJSON['ApexPage']['apiVersion'][0]);
              }
            }
            if (fs.existsSync(vfFile)) {
              const vfBody = fs.readFileSync(vfFile, 'utf8');
              const referSiteReg = /{!.*(\$Site|\$Network).*}/ig;

              if (referSiteReg.test(vfBody)) {
                if (componentProperties['ApexPage'] == undefined) {
                  componentProperties['ApexPage'] = {};
                }
                if (componentProperties['ApexPage'][vfName] == undefined) {
                  componentProperties['ApexPage'][vfName] = {};
                }
                componentProperties['ApexPage'][vfName]['RefersToSite'] = 1;
              }

            }
          }
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
            //Count Used Components by Namespace
            let auraCmpFile = `${auraPath}/${auraName}/${auraName}.cmp`;
            this.loggit.loggit(`Extracting info from ${auraCmpFile}`);

            if (fs.existsSync(auraCmpFile)) {

              let auraBody = fs.readFileSync(auraCmpFile, 'utf8');

              this.loggit.loggit('Performing Regex search against component for namespaces');
              const componentsReg = /<(\w+:\w+)/ig;
              let referencedComponents = this.getMatches(auraBody, componentsReg);
              if (referencedComponents.length > 0) {
                this.loggit.loggit(`Found the following Components: ${JSON.stringify(referencedComponents)}`);
                if (componentProperties['AuraDefinitionBundle'] == undefined) {
                  componentProperties['AuraDefinitionBundle'] = {};
                }
                if (componentProperties['AuraDefinitionBundle'][auraName] == undefined) {
                  componentProperties['AuraDefinitionBundle'][auraName] = {};
                }
                if (componentProperties['AuraDefinitionBundle'][auraName]['namespaceReferences'] == undefined) {
                  componentProperties['AuraDefinitionBundle'][auraName]['namespaceReferences'] = {};
                }
                referencedComponents.forEach(element => {
                  let ns = element.split(":", 2)[0];
                  if (componentProperties['AuraDefinitionBundle'][auraName]['namespaceReferences'][ns] == undefined) {
                    componentProperties['AuraDefinitionBundle'][auraName]['namespaceReferences'][ns] = 1;
                  }
                  else {
                    componentProperties['AuraDefinitionBundle'][auraName]['namespaceReferences'][ns] += 1
                  }
                });
              }
              this.loggit.loggit('Extracting implemented and extended interfaces');
              const interfaceReg = /(?:implements|extends)\s*=\s*"([\w ,:]+)"/igm;
              let interfaceMatches = this.getMatches(auraBody, interfaceReg);
              if (interfaceMatches.length > 0) {
                this.loggit.loggit(`Found the following Interfaces: ${JSON.stringify(interfaceMatches)}`);
                if (componentProperties['AuraDefinitionBundle'] == undefined) {
                  componentProperties['AuraDefinitionBundle'] = {};
                }
                if (componentProperties['AuraDefinitionBundle'][auraName] == undefined) {
                  componentProperties['AuraDefinitionBundle'][auraName] = {};
                }
                if (componentProperties['AuraDefinitionBundle'][auraName]['interfaces'] == undefined) {
                  componentProperties['AuraDefinitionBundle'][auraName]['interfaces'] = {};
                }
                interfaceMatches.forEach(element => {
                  let interfaces = element.split(/ *, */);
                  interfaces.forEach(element => {
                    componentProperties['AuraDefinitionBundle'][auraName]['interfaces'][element] = 1;
                  });
                })
              }
            }
            else {
              this.loggit.loggit('File not found');
            }
          }
          break;
      }

      inventory[metadataType] = typeInv;
    }

    //Check Person Accounts
    let pafile = `${this.flags.sourcefolder}/objects/PersonAccount.object`;
    if (fs.existsSync(pafile)) {
      if (dependencies['features'] == undefined) {
        dependencies['features'] = {};
      }
      dependencies['features']['PersonAccount'] = 1;
    }

    inventory['apiVersions'] = apiVersions;
    inventory['componentProperties'] = componentProperties;
    inventory['dependencies'] = dependencies;
    return inventory;
  }


  private getMembers(mdTypeDef) {
    this.loggit.loggit('Getting wildcard members for ' + mdTypeDef.name);
    let retVal = mdTypeDef['members'];
    if (mdmap[mdTypeDef.name] != undefined) {
      if (mdmap[mdTypeDef.name]['folder'] != 'null' && mdmap[mdTypeDef.name]['extension'] != 'null') {
        retVal = this.getMembersFromFiles(mdmap[mdTypeDef.name]['folder'], mdmap[mdTypeDef.name]['extension']);
        //        this.loggit.loggit("Added Members from files.:" + JSON.stringify(retVal));
      }
    }
    return retVal;
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
    });

    this.loggit.loggit('Found Members: ' + JSON.stringify(members));
    return members;
  }

  private getMatches(searchString, regex) {
    let matches = [];
    let match;
    while (match = regex.exec(searchString)) {
      matches.push(match[1]);
    }
    this.loggit.loggit(`Found ${matches.length} matches`);
    this.loggit.loggit(JSON.stringify(matches));
    return matches;
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

    let xmlData = fs.readFileSync(xmlfile, 'utf8');
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

}

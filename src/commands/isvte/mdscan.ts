/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { flags, SfdxCommand  } from '@salesforce/command';
import fs = require('fs-extra');
import xml2js = require('xml2js');
import { packageInventory } from '../../common/inventory';



export default class mdscan extends SfdxCommand {

  private enableDebug = false;
  private showFullInventory = false;

  public static description =  'scan a package and provide recommendations based on package inventory';
 
  public static examples = [
`Scan a package and provide inventory of monitored metadata items and enablement messages:
\t$sfdx isvte:mdscan -d ./mdapi
Scan a package and provide a complete inventory of package metadata:
\t$sfdx isvte:mdscan -d ./mdapi -f
Display this help message:
\t$sfdx isvte:mdscan -h

For more information, please connect in the Salesforce Partner Community https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8iCAA or log an issue in github https://github.com/forcedotcom/isvte-sfdx-plugin
`
  ];


  protected static flagsConfig = {
    sourcefolder: flags.directory({char: 'd', description: 'directory containing package metadata', default: 'mdapiout' }),
    showfullinventory: flags.boolean({char:'f', description: 'show package inventory only'}),
  };

  // withlogging: flags.boolean({char:'l', description: 'enable verbose debug logging'}),

  // protected static flagsConfig = {
  //   sourcefolder: flags.directory({char: 'd', description: messages.getMessage('sourcefolderFlagDescription'), default: 'mdapiout' }),
  //   withlogging: flags.boolean({char:'l', description: messages.getMessage('withloggingFlagDescription')}),
  //   showfullinventory: flags.boolean({char:'f', description: messages.getMessage('showfullinventoryFlagDescription')}),
  // };


  private packageInventory = packageInventory;

  public async run(): Promise<any> { // tslint:disable-line:no-any


    this.enableDebug = this.flags.withlogging;
    this.showFullInventory = this.flags.fullinventory;

    if (!fs.existsSync(this.flags.sourcefolder)) {
      this.loggit(`your source folder [${this.flags.sourcefolder}] doesn't exist`, 'Error');
    }

    const packagexml = `${this.flags.sourcefolder}/package.xml`;

    let packageJSON = this.parseXML(packagexml,true);
    if (packageJSON['Package']) {
      packageJSON = packageJSON['Package'];
    }
    else {
      this.loggit(`Package.xml  ${packagexml} appears to be invalid `, 'Error');
    }
    
    this.checkPackage(packageJSON);
 
    if (this.showFullInventory) {
    this.ux.log('Inventory of Package:');
    this.ux.table(this.packageInventory.getFullInvArray(),['metadataType','count']);
    }
    else {
    this.ux.log('Inventory of Package:');
    
    this.ux.table(this.packageInventory.getMonitoredInvArray(), ['Metadata Type','count']);

    this.ux.log('\nISV Technical Enablement:');
    this.ux.log(this.packageInventory.getRecommendations());
    this.ux.log('\nInstallation Warnings:');
    this.ux.log(this.packageInventory.getInstallationWarnings());
    }
    return this.packageInventory.getJSONOutput();
  
}

  private checkPackage(p) {

    this.loggit('-Getting Inventory');
    this.packageInventory.setMetadata(this.inventoryPackage(p.types));
  }

  private inventoryPackage(types) {
    let inventory = {};
    for (var typeIdx in types) {
      let metadataType = types[typeIdx]['name'];
      let typeInv = {};

      typeInv['index'] = typeIdx;
      typeInv['count'] = types[typeIdx]['members'].length;

      this.loggit('Checking MetadataType: '  + metadataType);
      this.loggit('  Found ' + types[typeIdx]['members'].length + ' members');
      this.loggit(types[typeIdx]['members'],'json');
      //Check for wildcard members
      if (types[typeIdx]['members'].includes('*')) {
        types[typeIdx]['members'] = this.getMembers(types[typeIdx]);
      }
      this.loggit(types[typeIdx]['members'],'json');
      switch (String(metadataType)) {
        case 'CustomField' :
          //Do per object field counts
          let objectFields = {};  
        
          for (var fieldIdx in types[typeIdx]['members']) {
            let fieldFullName = types[typeIdx]['members'][fieldIdx];
            let objectName = fieldFullName.split(".")[0];
            let fieldName = fieldFullName.split(".")[1];
            let objectType = 'Standard';
            
            this.loggit('Checking field: ' + fieldName + ' on Object: ' + objectName + ' --- ' + fieldFullName);
            if (objectName.slice(-3) == '__c' || objectName.slice(-3) == '__b') {
              objectType = 'Custom';
            }
            if (objectName.slice(-3) == '__x') {
              objectType = 'External';
            }
            if (objectFields[objectName]) {
              objectFields[objectName]['count']++
            }
            else {
              objectFields[objectName] = {'count': 1, 'objectType': objectType};
            }
          }
          typeInv['objects'] = objectFields;

          break;
        case 'CustomObject' :
          // Look for Custom Settings, External Objects,  Person Accounts, Big Objects
          this.loggit('Deep Inventory on Custom Objects');
          const objectPath = `${this.flags.sourcefolder}/objects`;
          //let xoType = {count:0};
          let xoCount = 0;
          //let boType = {count:0};
          let boCount = 0;
          let csType = {count:0};
          let peType = {count:0};
          let fmType = {count:0};
          
          for (var objIdx in types[typeIdx]['members']) {
            let objectName = types[typeIdx]['members'][objIdx];
            this.loggit('Checking Object: '+ objectName);
            //Check external Objects
            if  (objectName.slice(-3) == '__x') {
              //xoType['count']++;
              xoCount++;
            }
            //Check Big Objects
            if  (objectName.slice(-3) == '__b') {
            //  boType['count']++;
              boCount++;
            }

            //Check Platform Events
            if  (objectName.slice(-3) == '__e') {
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
        case 'PlatformEventChannel' : 
          //Look for ChangeDataEvents
          break;
        case 'Flow' :
        //Check for Flow Templates
            
          this.loggit('Checking flows');
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
          const flowPath = `${this.flags.sourcefolder}/flows`;
           for (var flowIdx in types[typeIdx]['members']) {
            let flowName = types[typeIdx]['members'][flowIdx];
            let flowXml = `${flowPath}/${flowName}.flow`;
            let flowJSON = this.parseXML(flowXml);
            if (flowJSON['Flow'] && flowJSON['Flow']['isTemplate'] && flowJSON['Flow']['isTemplate'][0] === 'true') {
              templateCount++;
            }
          }
          typeInv['FlowTemplate'] = templateCount;
          break;
          case 'CustomApplication' :
            let lightningCount = 0;
            let classicCount = 0;
            let lightingConsoleCount = 0;
            let classicConsoleCount = 0;
            for (var appIdx in types[typeIdx]['members']) {
              let appName = types[typeIdx]['members'][appIdx];
              let uiType;
              let navType;
              this.loggit('Checking App: '+ appName);
              const appPath = `${this.flags.sourcefolder}/applications`;
              let appXml = `${appPath}/${appName}.app`;
              let appJSON = this.parseXML(appXml);
              if (appJSON['CustomApplication']) {
           //   this.loggit(appJSON,'JSON');
              if (appJSON['CustomApplication']['uiType']) {
           //     this.loggit(appJSON['uiType'][0]);
                uiType = appJSON['CustomApplication']['uiType'][0];
              }
              if (appJSON['CustomApplication']['navType']) {
           //     this.loggit(appJSON['navType'][0]);
                navType = appJSON['CustomApplication']['navType'][0];
              }
              if (uiType === 'Lightning') {
                lightningCount++;
                if (navType === 'Console') {
                  lightingConsoleCount++;
                }
              }
              else if (uiType === 'Aloha') {
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
          case 'ConnectedApp' :
              this.loggit('Checking Connected Apps');
              
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
              this.loggit('Interrogating Apex');
              let futureCount = 0;
             // let testCount = 0;
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
                  
                

                let classBody = fs.readFileSync(classFile,'utf8');
               // this.loggit(classBody);
               //const testReg = /@istest/ig;
                const futureReg = /@future/ig;
                const invocableReg = /@InvocableMethod|InvocableVariable/ig;
                const batchReg = /implements\s+Database\.Batchable/ig;
                const scheduleReg = /implements\s+Schedulable/ig;
                const restReg = /@RestResource/ig;
                const soapReg = /webservice\s+static/ig;

               
                //  if (testReg.test(classBody)) {
              //    testCount++;
              //  }
                if (futureReg.test(classBody)) {
                  futureCount ++;
                }
                if (invocableReg.test(classBody)) {
                  invocableCount ++;
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
              }
              typeInv['FutureCalls'] = futureCount;
              typeInv['InvocableCalls'] = invocableCount;
             // typeInv['TestMethods'] = testCount;
              typeInv['BatchApex'] = batchCount;
              typeInv['SchedulableApex'] = schedulableCount;
              typeInv['ApexRest'] = apexRestCount;
              typeInv['ApexSoap'] = apexSoapCount;


          break;
          case 'ApexTrigger' :
              this.loggit('Interrogating Trigger');
              let triggerInv = {};
              //let asyncTrigger = {'count':0};
              let asyncCount = 0;
              const triggerPath = `${this.flags.sourcefolder}/triggers`;
              for (var triggerIdx in types[typeIdx]['members']) {
                let triggerName = types[typeIdx]['members'][triggerIdx];
                let triggerFile = `${triggerPath}/${triggerName}.trigger`;
                let triggerBody = fs.readFileSync(triggerFile,'utf8');
                const triggerDetailReg = /trigger\s+(\w+)\s+on\s+(\w+)\s*\((.+)\)/im;
                let triggerDetail = triggerDetailReg.exec(triggerBody);
                let triggerObj = triggerDetail[2];
                let triggerType = triggerDetail[3];
                this.loggit('Trigger Name:' + triggerName);
                this.loggit('Trigger Object:' + triggerObj);
                this.loggit('Trigger Type: ' + triggerType);
                if (triggerObj.slice(-11).toLowerCase() === 'changeevent'){
                //  asyncTrigger['count']++;
                  asyncCount++;
                }
                if (triggerInv[triggerObj]) {
                  triggerInv[triggerObj]['count']++;
                }
                else {
                  triggerInv[triggerObj] = {count: 1};
                }
              }
            //  this.loggit(triggerInv,'JSON');
              typeInv['objects'] = triggerInv;
              typeInv['AsyncTrigger'] = asyncCount;
              //inventory['AsyncTrigger__c'] = asyncTrigger;

          break;
          case 'LightningComponentBundle' :
            this.loggit('Interrogating LWC');
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
              
              this.loggit('Checking LWC ' + lwcName);
             // this.loggit(lwcJSON,'JSON');
              if (lwcJSON['isExposed'] && lwcJSON['isExposed'][0] === 'true') {
                exposedCount++;
              }
              if (lwcJSON['targets'] && lwcJSON['targets'][0]['target']) {
                this.loggit('Checking Targets');
                this.loggit(lwcJSON['targets'][0]);
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
      }
   
      inventory[metadataType] = typeInv;
    }

    //Check Person Accounts
    let pafile = `${this.flags.sourcefolder}/objects/PersonAccount.object`;
    let paType = {count:0};

    if (fs.existsSync(pafile)) {
      paType['count'] = 1;
    }
    inventory['PersonAccount__c'] = paType;
    return inventory;
  }

  private getMembers(mdTypeDef) {
    this.loggit('Getting ')
    this.loggit(mdTypeDef,'json');
    switch (String(mdTypeDef['name'])) {
      case 'ApexClass' :
        return this.getMembersFromFiles('classes','cls');
      case 'CustomObject' :
        return this.getMembersFromFiles('objects','object');
      case 'CustomObject' :
        return this.getMembersFromFiles('objects','object');
      case 'CustomObject' :
        return this.getMembersFromFiles('objects','object');
      default:
        return mdTypeDef['members'];
    }
  }

  private getMembersFromFiles(folder,extension) {
    const typePath = `${this.flags.sourcefolder}/${folder}`;
    const members = [];
    if (!fs.existsSync(typePath)) {
      this.loggit(`Folder ${typePath} does not exist. Cannot find members`);
      return members;
    }
    this.loggit(`Looking in folder ${typePath} for members`);
    const folderContents = fs.readdirSync(typePath);
    this.loggit(folderContents,'json');
    folderContents.forEach(element => {
      
      const [fileName, ext] = [element.substr(0,element.lastIndexOf('.')),element.substr(element.lastIndexOf('.')+1,element.length)]
      console.log('File: ' + fileName);
      console.log('Extension: ' + ext);
      if (ext === extension) {
        members.push(fileName);
      }
      return members;
    });
    
    this.loggit(members,'json');
  }

  private parseXML(xmlfile, dieOnError = false) {
    const parser = new xml2js.Parser({ attrkey: 'ATTR' });
    let json = [];
    let error = undefined;
  
    if (!fs.existsSync(xmlfile)) {
      if (dieOnError) {
        this.loggit(`Cannot find ${xmlfile} in ${this.flags.sourcefolder}`, 'Error');
      }
      else {
        this.loggit(`Cannot find ${xmlfile} in ${this.flags.sourcefolder}`);
        return json;
      }
    }

    let xmlData = fs.readFileSync(xmlfile, 'ascii');
    parser.parseString(xmlData.substring(0, xmlData.length), function (err, result) {
      error = err;
      json = result;
    });

    if (error) {
      this.loggit(`Error parsing ${xmlfile}: ${error}`,'Error');
    }
    return json;
  }

  private loggit(logMessage, type='') {
    if (type==='Error') {
      this.ux.error(logMessage);
    }
    else if (this.enableDebug) {
      if (type==='JSON'){
        this.ux.logJson(logMessage);
      }
      else {
        this.ux.log(logMessage);
      }
    }
  }

}
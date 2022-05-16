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
  SfdxError,
} from '@salesforce/core';

import {
  Loggit
} from '../../common/logger';
import fs = require('fs-extra');
//import json2html = require('node-json2html');

import {
  packageInventory
} from '../../common/inventory';
import {
  minAPI
} from '../../common/rules';

import {
  inventoryPackage,
  parseXML
} from '../../common/metadataScan'

import *
  as util
  from 'util'

  import MetadataFilterFromPackageXml
  from 'sfdx-essentials/lib/commands/essentials/metadata/filter-from-packagexml';


export default class mdscan extends SfdxCommand {

  private showFullInventory = false;
  private formatHTML = false;
  private languageScan = false;
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
  private tmpParentFolder = '.isvtetmp_' + Math.random().toString(36).substring(2, 15);
  private sfdxConvertFolder = this.tmpParentFolder + '/mdapi' ;
  private sfdxConvertFolderFilter = this.tmpParentFolder + '/mdapiFiltered';

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
    }),
    languagescan: flags.boolean({
      char: 'l',
      description: 'perform a scan for potentially exclusive or offensive language'
    }),
    html: flags.boolean({
      description: 'generate html formatted output'
    }),

  };


  public async run(): Promise<any> { // tslint:disable-line:no-any

    this.loggit = new Loggit('isvtePlugin');

    this.showFullInventory = this.flags.showfullinventory;
    this.sourceFolder = this.flags.sourcefolder;
    this.showTechAdoption = this.flags.techadoption;
    this.sfdxPackageXml = this.flags.sfdxpackagexml;
    this.languageScan = this.flags.languagescan;
    this.formatHTML = this.flags.html;

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
      this.loggit.logLine(`your source folder ${this.sourceFolder} doesn't exist`, 'Error');
      throw new SfdxError(`Source Folder ${this.sourceFolder} does not exist`, 'SourceNotExistError');
    }

      
    // If this is source formatted, convert it to MDAPI Format
    
    if (fs.existsSync(this.sourceFolder + '/sfdx-project.json')) {
      const exec = util.promisify(require('child_process').exec);

      try {
        
        // force:source:convert in a temporary folder
        const sfdxConvertCommand = `sfdx force:source:convert -d ${this.sfdxConvertFolder} -r ${(this.sourceFolder != mdscan.flagsConfig.sourcefolder.default) ? this.sourceFolder : './'}`;
        const { stderr } = await exec(sfdxConvertCommand);
        if (stderr) {
          throw new SfdxError(`Unable to convert ${this.sourceFolder} to MDAPI Format`, 'ConversionToMetadataError');
        }

        // If argument packageXml is sent, convert SFDX project into metadatas folder then filter it 
        if (this.sfdxPackageXml) {
          // Filter metadatas folder using package.xml
          await MetadataFilterFromPackageXml.run([
            '-i', this.sfdxConvertFolder,
            '-o', this.sfdxConvertFolderFilter,
            '-p', this.sfdxPackageXml,
            '-s']);
          this.sourceFolder = this.sfdxConvertFolderFilter; // Set filtered mdapi folder as sourceFolder 
          // Remove filtered metadata folder if existing
          if (fs.existsSync(this.sfdxConvertFolder)) {
            fs.removeSync(this.sfdxConvertFolder);
          }
        }
        else {
          this.sourceFolder = this.sfdxConvertFolder;
        }
      }
      catch (e) {
        throw e;
      }
      
    }

    // Process MD Scan

    const packagexml = `${this.sourceFolder}/package.xml`;

    let packageJSON:object = parseXML(packagexml, true);
    if (packageJSON['Package']) {
      packageJSON = packageJSON['Package'];
    } else {
      this.loggit.logLine(`Package.xml  ${packagexml} appears to be invalid `, 'Error');
      throw new SfdxError(`Package.xml  ${packagexml} appears to be invalid `, 'InvalidPackageXMLError');

    }

    this.cleanInventory(packageJSON);
    this.packageInventory = new packageInventory();

    if (this.flags.minapi) {
      this.packageInventory.setMinAPI(this.flags.minapi);
    }
    this.packageInventory.setMetadata(inventoryPackage(this.sourceFolder, packageJSON, {scanLanguage: this.languageScan}));
   // Generate Report

   //Just show inventory
    if (this.showFullInventory) {
      this.ux.styledHeader('Inventory of Package:');
      this.ux.table(this.packageInventory.getFullInvArray(), ['metadataType', 'count']);
    }
    //HTML Format
    
    else if (this.formatHTML) {
      this.ux.log('Comming Soon');
    }
      /*
      Header
        Title
        Date
      
      Monitored Inventory
        [Items]
      
      Enablement
        [Items]
          [Details]
      */
    /*  
          json2html.component.add({
            "pageHeader": {"<>":"div","id":"${id}","html":[
              {"<>":"h2","html":"ISVTE Plugin Scan Results"},
              {"<>":"div","html":[
                  {"<>":"div","html":"Date:"},
                  {"<>":"div","html":"${Date}"}
                ]},
              {"<>":"div","html":"Rules Version:"},
              {"<>":"div","html":"${RulesVersion}"}
            ]},
            "sectionHeader" :  {"<>":"h2","html":"${name}"},
            "enablementLink":{"<>":"a","href":"${url}","text":"${url}"},
            "enablementComponents":{"<>":"p","html":"Impacted Components: ${value}"},
            "enablementContent":{"<>":"li","html":[
              {"<>":"p","html":"${label}"},
              {"<>":"p","html":"${message}"},
              {"[]":"enablementComponents","obj":function(){
                if (this.exceptions != undefined && this.exceptions.length > 0)
                  return(this.exceptions.join(', '));
                else
                  return null;
              }},
              {"[]":"enablementLink"},
            ]},
            "inventoryItem" :{"<>":"tr","html":[
              {"<>":"td","html":"<pre>${label}<pre>"},
              {"<>":"td","html":"${count}"}
            ]},
            "installationBlockingItems":{"<>":"li","text":"${label}"},
            "installationWarnings":{"<>":"li","html":[
              {"<>":"p","html":"Package Cannot be installed in ${edition} due to:"},
              {"<>":"ul","html":[
                {"[]":"installationBlockingItems","obj":function(){
                  return(this.blockingItems);
                }
                }
              ]}
            ]},
            "dependencies": {"<>":"li","html":[
              {"html":"${label}"},
              {"obj":function(){
                if (this.items != undefined && this.items.length > 0)
                  return(this.items.join(', '))
                else
                  return null
              },
              "html":"${value}"}
            ]}
          })
      const templates= {
        "pageTemplate": [
          {"[]":"pageHeader","obj":function(){
            return(this.Status);
        }},
        {"[]":"sectionHeader","obj":function(){
            return({"name":"Metadata Inventory"});
        }},
        {"<>":"table","html":[
          {"<>":"thead","html":[
            {"<>":"tr","html":[
              {"<>":"th","html":"Metadata Type"},
              {"<>":"th","html":"Count"},
            ]}
          ]},
          {"<>":"tbody","html":[
            {"[]":"inventoryItem","obj":function(){
              return(this.MonitoredItems);
            }}
          ]}
         
        ]},
        {"[]":"sectionHeader","obj":function(){
          return({"name":"Best Practices and Feature Recommendations"});
        }},
        {"<>":"ul","html":[
          {"[]":"enablementContent","obj":function(){
            return(this.Recommendations);
          }}
        ]},
        {"[]":"sectionHeader","obj":function(){
          return({"name":"Quality Rules"});
        }},
        {"<>":"ul","html":[
          {"[]":"enablementContent","obj":function(){
            return(this.CodeQualityNotes);
          }}
        ]},
        {"[]":"sectionHeader","obj":function(){
          return({"name":"Partner Alerts"});
        }},
        {"<>":"ul","html":[
          {"[]":"enablementContent","obj":function(){
            return(this.Alerts);
          }}
        ]},
        {"[]":"sectionHeader","obj":function(){
          return({"name":"Installation Warnings"});
        }},
        {"<>":"ul","html":[
          {"<>":"h3","html":"Editions"},
          {"[]":"installationWarnings","obj":function(){
            return(this.InstallationWarnings);
          }},
          {"<>":"h3","html":"Dependencies"},
          {"[]":"dependencies","obj":function(){
            return(this.Dependencies);
          }}
        ]},

        ]
      }

      htmlOut += json2html.render(this.packageInventory.getJSONOutput(),templates.pageTemplate);
      
      fs.writeFileSync('result.html',htmlOut);
      cli.open('result.html');

    }*/
    //Text format
    else {
      if (!this.suppressAllInv) {
        this.ux.styledHeader('Inventory of Package:');
        let inventoryArray = this.packageInventory.getMonitoredInvArray().filter(element => {
          return (!this.suppressZeroInv || element.count > 0);
        });

        this.ux.table(inventoryArray,{
          label: {header:"Metadata Type"},
          count: {header:"Count"}
        });
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
          this.ux.styledHeader('Dependencies:');
          for (var dependency of dependencies) {
            this.ux.log(`${dependency.label}`);
            if (dependency['items']) {
              for (var depItem of dependency.items) {
                this.ux.log(`\t${depItem}`);
              }
            }
          
          }
          this.ux.log('\n');
        }
      }

      if (this.showTechAdoption) {
        this.ux.styledHeader('Technology Adoption:');
        this.ux.log('The responses below correspond to the ISV Technology Adoption Survey for FY\'22.\nPlease note that the points and answers are not indended to be exhaustive and only reflect that which can be identified within the metadata source.\nAccess the Survey here: https://www.getfeedback.com/r/2ssZhMKB/\n\n');
        for (var category of this.packageInventory.getTechAdoptionScore()) {
          this.ux.log(`${category.categoryLabel} (${category.points} Points)\n`);
          let i = 1;
          for (var tech of category.technologies) {
            this.ux.log(` ${i++}. ${tech.name}: ${tech.question} (${tech.maxPoints} Points) \n   ${tech.found ? 'Found' : tech.detectable ? 'Not Found': 'Not Identifiable in Metadata'} `);
            if (tech.levelUp != undefined) {
              this.ux.log(`\t${tech.levelUp.message}`);
              if (tech.levelUp.url != undefined) {
                this.ux.log(`\tURL:${tech.levelUp.url}`);
              }
            }
            this.ux.log('\n');
          }
          this.ux.log('\n');
        }
      
      }

      if (this.languageScan) {
        this.ux.styledHeader('Language Warnings');
        this.ux.log('Language scan is provided by https://github.com/get-alex/');
        if (Object.entries(this.packageInventory.getLanguageWarnings()).length == 0) {
          this.ux.log('No issues found');
        }
        for (let [mdTypeKey, mdTypeValue] of Object.entries(this.packageInventory.getLanguageWarnings())) {
          this.ux.log(`Metadata Type: ${mdTypeKey}`);
          for (let [mdItemKey, mdItemValue] of Object.entries(mdTypeValue)) {
            this.ux.log(`\t${mdItemKey}`);
            for (let result of mdItemValue) {
              this.ux.log(`\t\tSource: ${result.context}`);
              this.ux.log(`\t\tException: ${result.message}`);
              this.ux.log(`\t\tLine: ${result.line}`);
              if(result.details) {
                this.ux.log(`\t\tDetails: ${result.details}`);
              }
              this.ux.log('\n');
            }
          }
        }
      }

    }

    //Feedback
    this.ux.log('Please provide feedback on this tool: https://bit.ly/TEPluginFeedback');

    // Get MdScan JSON Output
    const outputRes = this.packageInventory.getJSONOutput();

    // Remove temp folders if existing
    if (fs.existsSync(this.tmpParentFolder)) {
      fs.removeSync(this.tmpParentFolder);

    }

    return outputRes;

  }

  cleanInventory(packageJSON: object) {
    //normalize the inventory so that there is only 1 entry for each metadataType
   
    if (packageJSON['types'] && Array.isArray(packageJSON['types'])) {
      packageJSON['types'] = packageJSON['types'].reduce((cleaned, type) => {
        //Find the index in the "cleaned" array of the current type
        const foundIndex = cleaned.findIndex(cleanedType => cleanedType['name'][0] === type['name'][0]);
        //If it exists, then concat the members of cleaned and current
        if (foundIndex > -1) {
          cleaned[foundIndex]['members'] = [...cleaned[foundIndex]['members'],...type['members']];
        }
        //If not, then add it
        else {
          cleaned.push(type);
        }
        return cleaned;
      },[]);
    }
  }

  
}

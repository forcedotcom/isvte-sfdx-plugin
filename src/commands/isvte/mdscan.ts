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
  Loggit
} from '../../common/logger';
import fs = require('fs-extra');

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

    this.loggit = new Loggit('isvtePlugin');

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
      this.loggit.logLine(`your source folder ${this.sourceFolder} doesn't exist`, 'Error');
      throw new SfdxError(`Source Folder ${this.sourceFolder} does not exist`, 'SourceNotExistError');
    }

    // If argument packageXml is sent, convert SFDX project into metadatas folder then filter it 
    if (this.sfdxPackageXml) {
      const exec = util.promisify(require('child_process').exec);

      try {
        // force:source:convert in a temporary folder
        const sfdxConvertCommand = `sfdx force:source:convert -d ${this.sfdxConvertFolder} -r ${(this.sourceFolder != mdscan.flagsConfig.sourcefolder.default) ? this.sourceFolder : '.'}`;
        this.loggit.logLine(`Converting ${this.sourceFolder} into metadata...`);
        const { stderr } = await exec(sfdxConvertCommand);
        if (stderr) {
          throw new SfdxError(`Unable to convert ${this.sourceFolder} to metadatas`, 'ConversionToMetadataError');
        }
        else {
          this.loggit.logLine(`Converted ${this.sourceFolder} into metadata`);
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

    let packageJSON = parseXML(packagexml, true);
    if (packageJSON['Package']) {
      packageJSON = packageJSON['Package'];
    } else {
      this.loggit.logLine(`Package.xml  ${packagexml} appears to be invalid `, 'Error');
      throw new SfdxError(`Package.xml  ${packagexml} appears to be invalid `, 'InvalidPackageXMLError');

    }

    this.loggit.logLine('Parsing Package');
    this.packageInventory = new packageInventory();

    if (this.flags.minapi) {
      this.loggit.logLine(`Setting Minimum API version for quality checks to ${this.flags.minapi}`);
      this.packageInventory.setMinAPI(this.flags.minapi);
    
    }
    this.packageInventory.setMetadata(inventoryPackage(this.flags.sourcefolder, packageJSON));
   

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
          this.ux.styledHeader('Dependencies:');
          for (var dependency of dependencies) {
            this.ux.log(`  ${dependency.label}`);
            if (dependency['items']) {
              for (var depItem of dependency.items) {
                this.ux.log(`    ${depItem}`);
              }
            }
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

    //Feedback
    this.ux.log('Please provide feedback on this tool: https://bit.ly/TEPluginFeedback');

    // Get MdScan JSON Output
    const outputRes = this.packageInventory.getJSONOutput();

    // Remove filtered metadata folder if existing
    if (fs.existsSync(this.sfdxConvertFolderFilter)) {
      fs.removeSync(this.sfdxConvertFolderFilter);
    }

    return outputRes;

  }

}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  SfdxCommand
} from '@salesforce/command';
import {
  mdTypes,
  enablementRules,
  editionWarningRules,
  alertRules,
  qualityRules,
  rulesVersion,
  techAdoptionRules
} from '../../common/rules';
import {
  Loggit
} from '../../common/logger';

export default class listrules extends SfdxCommand {
  private loggit;

  public static description = 'display all enablement rules and edition warnings';

  public static examples = [
    `Display the enablement rules and edition warnings which are checked by the isvte plugin:
\t$sfdx isvte:listrules
Display this help message:
\t$sfdx isvte:listrules -h

For more information, please connect in the ISV Technical Enablement Plugin
 Chatter group on the Salesforce Partner Community https://partners.salesforce.com/0F93A0000004mWj or log an issue in github https://github.com/forcedotcom/isvte-sfdx-plugin
`
  ];

  public async run(): Promise < any > { // tslint:disable-line:no-any

    this.loggit = new Loggit('isvtePluginListRules');

    this.loggit.logLine('Exporting all isvte Rules');

    this.ux.log(`Rule Definition version: ${rulesVersion}\n\n`);

    this.ux.styledHeader('Monitored Metadata Types');
    this.ux.table(mdTypes, ['label', 'metadataType']);
    this.ux.log('\n\n');
    this.ux.styledHeader('Best Practices and Feature Recommendations:');
    let i=1;
    for (var enablementRule of enablementRules) {
      if (enablementRule.resultFalse != undefined) {
        this.ux.log(`${i++}. ${this.resultToString(enablementRule.resultFalse)}\n`);
      }
      if (enablementRule.resultTrue != undefined) {
        this.ux.log(`${i++}. ${this.resultToString(enablementRule.resultTrue)}\n`);
      }
    }
    this.ux.log('\n\n');
    i=1;
    this.ux.styledHeader('Quality Rules:');
    for (var qualityRule of qualityRules) {
      if (qualityRule.resultFalse != undefined) {
        this.ux.log(`${i++}. ${this.resultToString(qualityRule.resultFalse)}\n`);
      }
      if (qualityRule.resultTrue != undefined) {
        this.ux.log(`${i++}. ${this.resultToString(qualityRule.resultTrue)}\n`);
      }
    }
    this.ux.log('\n\n');
    i=1;
    this.ux.styledHeader('Partner Alerts:');
    for (var alert of alertRules) {
      if (alert.resultFalse != undefined) {
        this.ux.log(`${i++}. ${this.resultToString(alert.resultFalse)}\n`);
      }
      if (alert.resultTrue != undefined) {
        this.ux.log(`${i++}. ${this.resultToString(alert.resultTrue)}\n`);
      }
    }
    this.ux.styledHeader('Installation Warnings:');
    this.ux.table(this.getAllEditionWarnings(), ['Edition', 'Item', 'Condition']);
    this.ux.log('\n\n');
    this.ux.styledHeader('Tech Adoption');
    this.ux.table(this.getAllAdoptionRules(),['Category','MetadataType']);
    this.ux.log('\n\n');
    return {
      'rulesVersion' : rulesVersion,
      'monitoredTypes': mdTypes,
      'enablementRules': enablementRules,
      'qualityRules': qualityRules,
      'partnerAlerts': alertRules,
      'editionWarnings': editionWarningRules,
      'techAdoptionRules': techAdoptionRules
    };

  };

  private resultToString(result) {
    let retVal = `${result.label}:\n  ${result.message}`;
    if (result.url != undefined) {
      retVal += `\n  ${result.url}`
    }
    return retVal + '\n';
  }

  
  private getAllEditionWarnings() {
    this.loggit.logLine('Formatting Edition Warnings for export');
    let retVal = [];
    for (let edition of editionWarningRules) {
      retVal.push({
        Edition: edition['name']
      });
      for (let blockingRule of edition['blockingItems']) {
        const conditionString = this.conditionToString(blockingRule.condition);
        retVal.push({
          Item: blockingRule.label,
          Condition: conditionString
        });
      }
    }
    return retVal;
  };

  private getAllAdoptionRules() {
    this.loggit.logLine('Formatting Tech Adoption Rules for export');
    let retVal = [];
    for (let category of techAdoptionRules) {
      retVal.push({
        Category: category['categoryName']
      });
      for (let rule of category['items']) {
        retVal.push({
          MetadataType: rule.label
        })
      }
    }
    return retVal;
  }

  private conditionToString(cond) {
    let retVal = '';
    
    switch (cond.operator) {
      case 'always':
        retVal = 'Always';
        break;
      case 'never':
        retVal = 'Never';
        break;
      case 'exists':
        retVal = `${cond.metadataType} Exists`;
        break;
      case 'notexists':
        retVal = `${cond.metadataType} Does Not Exist`;
        break;
      case 'null':
        retVal = `${cond.metadataType} is Null`;
        break;
      case 'gt':
        retVal = `${cond.metadataType} is Greater Than ${cond.operand}`;
        break;
      case 'gte':
        retVal = `${cond.metadataType} is Greater Than or Equal to ${cond.operand}`;
        break;
      case 'lt':
        retVal = `${cond.metadataType} is Less Than ${cond.operand}`;
        break;
      case 'lte':
        retVal = `${cond.metadataType} is Less Than or Equal to ${cond.operand}`;
        break;
      case 'eq':
        retVal = `${cond.metadataType} is Equal to ${cond.operand}`;
        break;
      case 'between':
        retVal = `${cond.metadataType} is Between ${cond.operand[0]} And ${cond.operand[1]}`;
        break; 
    }

    if (cond.conditionOr != undefined) {
      retVal += ' Or (' + this.conditionToString(cond.conditionOr) + ')';
    }
    if (cond.conditionAnd != undefined) {
      retVal += ' And (' + this.conditionToString(cond.conditionAnd) + ')';
    }
    return retVal;
  }

}

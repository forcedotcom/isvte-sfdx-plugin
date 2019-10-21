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
  qualityRules
} from '../../common/rules';
import {
  loggit
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

    this.loggit = new loggit('isvtePluginListRules');

    this.loggit.loggit('Exporting all isvte Rules');

    this.ux.styledHeader('Monitored Metadata Types');
    this.ux.table(mdTypes, ['name', 'metadataType']);
    this.ux.log('\n\n');
    this.ux.styledHeader('Enablement Rules');
    for (var enablementRule of this.getAllRules(enablementRules)) {
      this.ux.log(`Rule: ${enablementRule.label}\n Trigger: ${enablementRule.metadataType} ${enablementRule.threshold}\n Message: ${enablementRule.message}\n URL: ${enablementRule.url}\n`);
    }
    this.ux.log('\n\n');
    this.ux.styledHeader('Code Quality Checks');
    for (var qualityRule of this.getAllRules(qualityRules)) {
      this.ux.log(`Rule: ${qualityRule.label}\n Trigger: ${qualityRule.metadataType} ${qualityRule.threshold}\n Message: ${qualityRule.message}\n`);
    }
    this.ux.log('\n\n');
    this.ux.styledHeader('Edition Warnings');
    this.ux.table(this.getAllEditionWarnings(), ['Edition', 'Item', 'Threshold']);
    this.ux.log('\n\n');
    this.ux.styledHeader('Alerts');
    for (var alert of alertRules) {
      this.ux.log(`Alert Name: ${alert.label}\n Message: ${alert.message}\n URL: ${alert.url}\n Expiration: ${alert.expiration}\n`);
    }
    return {
      'Monitored Types': mdTypes,
      'Enablement Rules': this.getAllRules(enablementRules),
      'Code Quality Rules': this.getAllRules(qualityRules),
      'Edition Warnings': editionWarningRules,
      'Alerts': alertRules
    };

  };

  private getAllRules = function (ruleDefs) {
    this.loggit.loggit('Formatting Rules for export');
    let output = [];
    for (let mdType of ruleDefs) {
      if (mdType['threshold'] != undefined) {
        if (mdType['recPos'] != undefined) {
          output.push({
            metadataType: mdType['metadataType'],
            label: mdType['label'],
            threshold: `> ${mdType['threshold']}`,
            message: mdType['recPos']['message'],
            url: mdType['recPos']['url']
          });
        }
        if (mdType['recNeg'] != undefined) {
          output.push({
            metadataType: mdType['metadataType'],
            label: mdType['label'],
            threshold: `<= ${mdType['threshold']}`,
            message: mdType['recNeg']['message'],
            url: mdType['recNeg']['url']
          });
        }
      }
    }
    return output;
  };

  private getAllEditionWarnings = function () {
    this.loggit.loggit('Formatting Edition Warnings for export');
    let output = [];
    for (let edition of editionWarningRules) {
      output.push({
        Edition: edition['name']
      });
      for (let blockingRule of edition['blockingItems']) {
        output.push({
          Item: blockingRule['label'],
          Threshold: blockingRule['threshold']
        });
      }
    }
    return output;
  };
}

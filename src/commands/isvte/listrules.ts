/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {  SfdxCommand } from '@salesforce/command';
import { rules, editions, alerts } from '../../common/rules';

export default class listrules extends SfdxCommand {
  
  public static description = 'display all enablement rules and edition warnings';

  public static examples = [
`Display the enablement rules and edition warnings which are checked by the isvte plugin:
\t$sfdx isvte:listrules
Display this help message:
\t$sfdx isvte:listrules -h

For more information, please connect in the Salesforce Partner Community https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8iCAA or log an issue in github https://github.com/forcedotcom/isvte-sfdx-plugin
`
  ];

 
  private enablementRules = rules;
  private editionRules = editions;
  private pushAlerts = alerts;



  public async run(): Promise<any> { // tslint:disable-line:no-any

     this.ux.log('Enablement Rules');
     this.ux.table(this.getAllEnablementMessages(), ['Rule', 'Threshold', 'Message']);
     this.ux.log('\n\n');
     this.ux.log('Edition Warnings');
     this.ux.table(this.getAllEditionWarnings(),['Edition', 'Item', 'Threshold']);
     this.ux.log('\n\n');
     this.ux.log('Alerts');
     this.ux.table(this.pushAlerts,['label','message','url','expiration']);
     return {'Enablement Rules': this.getAllEnablementMessages(), 'Edition Warnings': this.editionRules,'Alerts':this.pushAlerts};

  };

 

  private getAllEnablementMessages = function() {
    let output = [];
    for (let mdType of this.enablementRules) {
      if (mdType['threshold'] != undefined) {
        if (mdType['recPos'] != undefined) {
          output.push({Rule:mdType['name'], Threshold: `>${mdType['threshold']}`, Message: mdType['recPos']});
        }
        if (mdType['recNeg'] != undefined) {
          output.push({Rule:mdType['name'], Threshold: `<${mdType['threshold']}`, Message: mdType['recNeg']});
        }
      }
      if (mdType['detailThreshold'] != undefined) {
        for (let mdDetail of mdType['detailThreshold']) {
          if (mdDetail['recPos'] != undefined) {
            output.push({Rule:mdDetail['name'], Threshold:`>${mdDetail['threshold']}`, Message: mdDetail['recPos']});
          }
          if (mdDetail['recNeg']!= undefined) {
            output.push({Rule:mdDetail['name'], Threshold:`<${mdDetail['threshold']}`, Message: mdDetail['recNeg']});
          }
        }
      }
    }
    return output;
  };

  

  private getAllEditionWarnings = function() {
    let output = [];
    for (let edition of this.editionRules) {
      output.push({Edition:edition['name']});
      for (let blockingRule of edition['blockingItems']) {
        output.push({Item:blockingRule['label'], Threshold: blockingRule['threshold'] });
      }
    }
    return output;
  };


}
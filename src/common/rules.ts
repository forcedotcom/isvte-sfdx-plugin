/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/*
Rules explained:
ruleSet = [rule,rule,...]

rule = {
  name: The Rule Name
  condition: ruleCondition
  resultTrue: result 
  resultFalse: result
}


   
result = {
  label: Friendly output to display when rule is triggered 
  message: Text to display
  url: link to content
  showDetails: boolean
}
A result must have a message and a label
if showDetails is true, then the individual components which pass the condition are included in the result 
e.g the first will output just the message. The second will output the message as well as each individual class with and API version that meets the criteria
{
    name: 'Metadata API Version',
    condition: {
      metadataType: 'apiVersions.mdapi',
      operator: 'between',
      operand: [20,'minAPI'],
    },
    resultTrue: {
      label: 'Using old Metadata API Version',
      message: `You appear to be using a version of Metadata API less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
    },
  },
  {
    name: 'Apex API Version',
    condition: {
      metadataType: 'apiVersions.ApexClass.*',
      operator: 'between',
      operand: [20,'minAPI'],
    },
    resultTrue: {
      label: 'Using old Apex API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },

  If condition resolves to True, then resultTrue is fired. If Condition resolves to false, then resultFalse is fired.
a rule must have a name, a label and a condition. AlertRules, EnablementRules and QualityRules must have  a resultTrue and/or a resultFalse

ruleCondition = {
  metadataType: The Metadata Type to query
  operator: One of: ['always', 'never', 'exists', 'notexists', 'null', 'gt', 'gte', 'lt', 'lte', 'eq','between']
  operand: value that operator works on.
  expiration: dateTime
  processAlways: boolean (only within a conditionOr OR a conditionAnd)
  conditionPerItem: boolean (only within a conditionAnd)
  conditionOr: ruleCondition
  conditionAnd: ruleCondition
}

A ruleCondition must have an operator
If operator is anything other than 'always' or 'never' then ruleCondition must have an operand and a metadataType
If operator is 'between', then operand must be a 2 element array noting the bounds of the between (non inclusive)
ruleCondition cannot have both a conditionAnd AND a conditionOR, but both are optional

OR:
If conditionOr exists, then the result is an OR of the result of the main condition and the conditionOr condition
If processAlways is true within the conditionOr, then conditionOr will be evaluated even if the main condition is already true

AND:
If conditionAnd exists then the resuls is an AND of the result of the main condition and the conditionAnd condition
If process Always is true within the conditionAnd, then conditionAnd will be evaluated even if the main condition is already false.
If conditionPerItem is true within the conditionAnd, then the ultimate result is based on the union of items which pass each side of the condition
  e.g.:
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gte',
      operand: 1,
      conditionAnd: {
        metadataType: 'Flow.objects.*',
        operator: 'gte',
        operand: 1,
      },
    },
    the above condition will resolve to true if there is any object with an apex trigger and if there is any object with a process builder trigger

    If the condition looks like:
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gte',
      operand: 1,
      conditionAnd: {
        metadataType: 'Flow.objects.*',
        operator: 'gte',
        operand: 1,
        conditionPerItem: true
      },
    },
    the condition will resolve to true if any object has both an apex trigger and a process builder trigger.
    */

/*Interface Definitions */

/* Monitored Metadata Types are those which are listed and counted in the output */

interface IMetadataType {
  label: string,
  metadataType: string;
}

type operatorTypes = 'always' | 'never' | 'exists' | 'notexists' | 'null' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';

interface ICondition {
  metadataType: string, //The Metadata Type to query
  operator: operatorTypes, // The operator of the condition
  operand?: number | [number | 'minAPI',number | 'minAPI'], //value that operator works on
  expiration?: string, //Expiration date of the condition
  processAlways?: Boolean,  //(only within a conditionOr OR a conditionAnd)
  conditionPerItem?: Boolean, // (only within a conditionAnd)
  conditionOr?: ICondition, //Extra condition to be ORed with this condition
  conditionAnd?: ICondition //Extra condition to be ANDed with this condition
  showDetails?: Boolean //Toggle whether individual items that meet the condition are displayed

}

interface IResult {
  label: string, //Friendly output to display when rule is triggered 
  message: string, //Text block to display
  url?: string, //link to content
  showDetails?: Boolean //Toggle whether individual items that trigger the rule are displayed
}

interface IRule {
  name: string, // The Rule Name
  condition: ICondition, // Logic to determine whether the rule is triggered
  resultTrue?: IResult, //Output if the condition is met 
  resultFalse?: IResult //Output if the condition is not met
}

interface IInstallRule {
  name: string, //Salesforce Edition
  blockingItems: {label: String, condition: ICondition}[] //Conditions which, if true, mean the package cannot be installed in this edition
}

interface ITechAdoptionRule {
  categoryName: string, // Category for the Tech score rule
  categoryLabel: string, //Friendly output for the score rule category
  items: IMetadataType[]
}

interface IDependecyRule {
  name: string, //Name for the dependency rule
  label: string, //Friendly output of the dependency rule
  condition: ICondition //Condition which fires the dependency rule
}

interface IDataModel {
  name: string, //Name of the cloud or feature this data model describes
  label: string,  //Friendly output of the cloud or feature name
  fields?: string[], //Array of fields (in Object.Field format) included in this datamodel
  objects?: string[], //Array of objects included in this data model
  namespaces?: string[], //Array of namespaces included in this data model
}

const minAPI = 45;

const rulesVersion = '20200527';

const standardNamespaces = [
  'c',
  'aura',
  'lightning',
  'ui',
  'apex',
  'ltng'
]

const mdTypes: IMetadataType[] = [{
  label: 'Permission Sets',
  metadataType: 'PermissionSet'
},
{
  label: 'Custom Profiles',
  metadataType: 'Profile'
},
{
  label: 'Custom Metadata',
  metadataType: 'CustomMetadata'
},
{
  label: 'Feature Parameters (Boolean)',
  metadataType: 'FeatureParameterBoolean'
},
{
  label: 'Feature Parameters (Date)',
  metadataType: 'FeatureParameterDate'
},
{
  label: 'Feature Parameters (Integer)',
  metadataType: 'FeatureParameterInteger'
},
{
  label: 'Custom Settings',
  metadataType: 'CustomSetting__c'
},
{
  label: 'Custom Labels',
  metadataType: 'CustomLabel'
},
{
  label: 'Tabs',
  metadataType: 'CustomTab'
},
{
  label: 'Flows',
  metadataType: 'Flow'
},
{
  label: 'Apex Classes',
  metadataType: 'ApexClass'
},
{
  label: 'Apex Triggers',
  metadataType: 'ApexTrigger'
},
{
  label: 'Custom Reports',
  metadataType: 'Report'
},
{
  label: 'Custom Report Types',
  metadataType: 'ReportType'
},
{
  label: 'Custom Apps',
  metadataType: 'CustomApplication'
},
{
  label: 'Connected Apps',
  metadataType: 'ConnectedApp'
},
{
  label: 'In-App Prompts',
  metadataType: 'Prompt'
},
{
  label: 'Static Resources',
  metadataType: 'StaticResource'
},
{
  label: 'Sharing Rules',
  metadataType: 'SharingRules'
},
{
  label: 'Validation Rules',
  metadataType: 'ValidationRule'
},
{
  label: 'Custom Objects',
  metadataType: 'CustomObject'
},
{
  label: 'Custom Fields',
  metadataType: 'CustomField'
},
{
  label: 'Platform Events',
  metadataType: 'PlatformEventChannel'
},
{
  label: 'Territory Management',
  metadataType: 'Territory'
},
{
  label: 'Territory Management 2.0',
  metadataType: 'Territory2'
},
{
  label: 'Visualforce Pages',
  metadataType: 'ApexPage'
},
{
  label: 'Aura Web Components',
  metadataType: 'AuraDefinitionBundle'
},
{
  label: 'Lightning Web Components',
  metadataType: 'LightningComponentBundle'
},
{
  label: 'Einstein Analytics Applications',
  metadataType: 'WaveApplication'
},
{
  label: 'Einstein Analytics Dashboards',
  metadataType: 'WaveDashboard'
},
{
  label: 'Einstein Analytics Dataflows',
  metadataType: 'WaveDataflow'
},
{
  label: 'Einstein Analytics Datasets',
  metadataType: 'WaveDataset'
},
{
  label: 'Einstein Analytics Lenses',
  metadataType: 'WaveLens'
},
{
  label: 'Einstein Analytics Template Bundles',
  metadataType: 'WaveTemplateBundle'
},
{
  label: 'Einstein Analytics Dashboards',
  metadataType: 'WaveDashboard'
},

{
  label: 'Record Types',
  metadataType: 'RecordType'
}
];

const enablementRules: IRule[] = [{
    name: 'ISV Technical Success Center',
    condition: {
        metadataType: 'any',
        operator: 'always'
    },
    resultTrue: {
      label: 'Visit the ISV Technical Success Center',
      message: 'For more resources to help build a successful app, visit the ISV Technical Success Center on the Partner Community',
      url: 'http://p.force.com/TECenter'
    }
  },
  {
    name: 'Flows',
    condition: {
      metadataType: 'Flow',
      operator: 'notexists',
    },
    resultTrue: {
      label: 'Take Advantage of Flows',
      message: 'Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.',
      url: 'https://partners.salesforce.com/0693A000007S2Dq'
    },
  },
  {
    name: 'Flow Templates',
    condition: {
      metadataType: 'Flow.FlowTemplate',
      operator: 'notexists',
      conditionAnd: {
        processAlways: false,
        metadataType: 'Flow',
        operator: 'exists'
      }
    },
    resultTrue: {
      label: 'Include your Flows as Templates',
      message: 'When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a'
    },
  },
  {
    name: 'Batch Apex',
    condition: {
      metadataType: 'ApexClass.BatchApex',
      operator: 'exists'
    },
    resultTrue: {
      label: 'Follow best practices for Batch Apex',
      message: 'For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar.',
      url: 'https://partners.salesforce.com/0693A000006aF9G',
    },
  },
  {
    name: 'In App Prompts',
    condition: {
      metadataType: 'Prompt',
      operator: 'notexists'
    },
    resultTrue: {
      label: 'Take Advantage of In-App Prompts',
      message: 'For more information about how to use In-App Prompts to keep your users informed, see this blog.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016'
    },
  },
  {
    name: 'Platform Cache',
    condition: {
      metadataType: 'PlatformCachePartition',
      operator: 'notexists'
    },
    resultTrue: {
      label: 'Take Advantage of Platform Cache',
      message: 'Use Platform Cache to improve the performance of your application.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/leverage-platform-cache-to-reduce-transaction-time-and-increase-customer-satisfaction-cd3616c9c6ee'
    }
  },
  {
    name: 'Custom Fields on Activity',
    condition: {
      metadataType: 'CustomField.objects.Activity',
      operator: 'gte',
      operand: 1
    },
    resultTrue: {
      label: 'Be aware of limits on Custom Fields on Activity',
      message: 'Please be aware that there is a hard limit of 100 fields on the Activity object including all managed and unmanaged fields. Your package will not install if this raises the number of fields on the Activity object past this threshold in your subscriber\'s org.'
    }
  },
  {
    name: 'Platform Events',
    condition: {
      metadataType: 'PlatformEventChannel',
      operator: 'exists'
    },
    resultTrue: {
      label: 'Be aware of Platform Events Best Practices',
      message: 'For more information on Platform Events and how to use them within your application, see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000GF5BPQA1'
    }
  },
  {
    name: 'Change Data Capture',
    condition: {
      metadataType: 'PlatformEventChannelMember',
      operator: 'exists'
    },
    resultTrue: {
      label: 'Be aware of Change Data Capture Best Practices',
      message: 'For more information on Change Data Capture and how to use it in your application, please see this webinar.',
      url: 'https://developer.salesforce.com/events/webinars/change-data-capture'
    }
  },
  {
    name: 'Aura Components',
    condition: {
      metadataType: 'AuraDefinitionBundle',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'LightningComponentBundle',
        operator: 'notexists'
      },
    },
    resultTrue: {
      label: 'Learn about migrating from Aura Web Components to Lightning Web Components',
      message: 'Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248'
    }
  },
  {
    name: 'Local LWC Development',
    condition: {
      metadataType: 'LightningComponentBundle',
      operator: 'exists'
    },
    resultTrue: {
      label: 'Lightning Web Component Local Development',
      message: 'Lightning Component Development can be significantly improved using local development. See this webinar for more information',
      url: 'https://developer.salesforce.com/event/salesforce-lightning-base-components-open-source'
    }
  },
  {
    name: 'Lightning Web Components',
    condition: {
      metadataType: 'LightningComponentBundle',
      operator: 'notexists'
    },
    resultTrue: {
      label: 'Take advantage of Lightning Web Components',
      message: 'Find more information about how to leverage the power of LWC and for best practices, see this webinar.',
      url: 'https://partners.salesforce.com/0693A000007Kd7oQAC'
    }
  },
  {
    name: 'Einstein Analytics Templates',
    condition: {
      metadataType: 'WaveTemplateBundle',
      operator: 'exists'
    },
    resultTrue: {
      label: 'Learn about Einstein Analytics Template Bundles',
      message: 'For more information on Creating & Distributing Analytics Apps using Templates see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000FYOQOQA5'
    }
  },
  {
    name: 'Feature Management',
    condition: {
      metadataType: 'FeatureParameterBoolean',
      operator: 'exists',
      conditionOr: {
        metadataType: 'FeatureParameterDate',
        operator: 'exists',
        conditionOr: {
          metadataType: 'FeatureParameterInteger',
          operator: 'exists'
        }
      }
    },
    resultTrue: {
      label: 'Learn more about using Feature Management',
      message: 'See this webinar for more information on using Feature Management within your package.',
      url: 'http://salesforce.vidyard.com/watch/pXTQPKtMkF8vmZDJoBidx9'
    }
  }

];

const qualityRules: IRule[] = [{
    name: 'Metadata API Version',
    condition: {
      metadataType: 'apiVersions.mdapi',
      operator: 'between',
      operand: [20,'minAPI'],
    },
    resultTrue: {
      label: 'Using old Metadata API Version',
      message: `You appear to be using a version of Metadata API less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
    },
  },
  {
    name: 'Apex API Version',
    condition: {
      metadataType: 'apiVersions.ApexClass.*',
      operator: 'between',
      operand: [20,'minAPI'],
      showDetails: true
    },
    resultTrue: {
      label: 'Using old Apex API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Trigger API Version',
    condition: {
      metadataType: 'apiVersions.ApexTrigger.*',
      operator: 'between',
      operand: [20,'minAPI'],
      showDetails: true
    },
    resultTrue: {
      label: 'Using old Trigger API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Aura Component API Version',
    condition: {
      metadataType: 'apiVersions.AuraDefinitionBundle.*',
      operator: 'between',
      operand: [20,'minAPI'],
      showDetails: true
    },
    resultTrue: {
      label: 'Using old Aura Component API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'LWC API Version',
    condition: {
      metadataType: 'apiVersions.LightningComponentBundle.*',
      operator: 'between',
      operand: [20,'minAPI'],
      showDetails: true
    },
    resultTrue: {
      label: 'Using old Lightning Web Component API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Visualforce API Version',
    condition: {
      metadataType: 'apiVersions.ApexPage.*',
      operator: 'between',
      operand: [20,'minAPI'],
    },
    resultTrue: {
      label: 'Using old Visualforce API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Custom Object Description',
    condition: {
      metadataType: 'componentProperties.CustomObject',
      operator: 'exists',
      showDetails: false,
      conditionAnd: {
        metadataType: 'componentProperties.CustomObject.*.descriptionExists',
        operator: 'notexists',
        showDetails: true
      }
    },
    resultTrue: {
      label: 'Custom Objects should have a description',
      message: `It is a best practice that Custom Objects have a description.`,
      showDetails: true
    }
  },
  {
    name: 'Custom Field Description',
    condition: {
      metadataType: 'componentProperties.CustomField',
      operator: 'exists',
      showDetails: false,
      conditionAnd: {
        metadataType: 'componentProperties.CustomField.*.descriptionExists',
        operator: 'notexists',
        showDetails: true
      }
    },
    resultTrue: {
      label: 'Custom Fields should have a description',
      message: `It is a best practice that Custom Fields have a description.`,
      showDetails: true
    }
  },
  {
    name: 'Triggers per Object',
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gt',
      operand: 1,
      showDetails: true
    },
    resultTrue: {
      label: 'Multiple Triggers per Object',
      message: 'It is a best practice to have 1 trigger per object. Please check triggers on the objects below to see if you can use triggers and trigger handlers to reduce the number of triggers per object.',
      showDetails: true
    }
  },
  {
    name: 'Process Builders per Object',
    condition: {
      metadataType: 'Flow.objects.*',
      operator: 'gt',
      operand: 1, 
      showDetails: true
    },
    resultTrue: {
      label: 'Multiple Process Builders per Object',
      message: 'It is a best best practice to have 1 record-change process per object. Please check Process Builders on the objects below to see if you can combine all processes into one.',
      showDetails: true
    }
  },
  {
    name: 'Change Processes per Object',
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gte',
      operand: 1,
      showDetails: true,
      conditionAnd: {
        metadataType: 'Flow.objects.*',
        operator: 'gte',
        operand: 1,
        conditionPerItem: true
      },
    },

    resultTrue: {
      label: 'Multiple Change Processes per Object',
      message: 'It is a best best practice to have 1 record-change process per object. Avoid using both Triggers and Process Builders on the same object.',
      showDetails: true
    }
  },
  {
    name: 'Apex Version Check',
    condition: {
      metadataType: 'apiVersions.ApexClass.*',
      operator: 'gte',
      operand: 48
    },
    resultFalse: {
      label: 'New security features in Apex using API version 48 or higher',
      message: 'There are new security features added to Apex which greatly simplify FLS checks for Security Review. Update your Apex to API version 48 or higher and review these release notes.',
      url:'https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_Security_stripInaccessible_GA.htm\n\thttps://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_WithSecurityEnforced_GA.htm'
    }
  },
  {
    name: 'Apex FLS Checks',
    condition: {
      metadataType: 'apiVersions.ApexClass.*',
      operator: 'notexists',
      conditionOr: {
        metadataType: 'componentProperties.ApexClass.*.StripInaccessible',
        operator: 'eq',
        operand: 1,
        conditionOr: {
          metadataType: 'componentProperties.ApexClass.*.SECURITY_ENFORCED',
          operator: 'eq',
          operand: 1,
          conditionAnd: {
            metadataType: 'apiVersions.ApexClass.*',
            operator: 'gte',
            operand: 48,
            conditionPerItem: true
          }
        }
  
      }
    },

    resultFalse: {
      label: 'New Apex Security Features',
      message: 'Starting with API version 48, you can use SOQL queries with the WITH SECURITY_ENFORCED modifier as well as the Apex method Security.stripInaccessible to provide FLS and CRUD checks eliminating the need to perform individual field accessibility checks to pass Security Review. Please review the attached release docs for more information',
      url: 'https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_Security_stripInaccessible_GA.htm \n https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_WithSecurityEnforced_GA.htm'
    }
  },
  {
    name: 'Translations',
    condition: {
      metadataType: 'Translations',
      operator: 'notexists'
    },
    resultTrue: {
      label: 'Use Translations to appeal to a broader audience',
      message: 'Users prefer to work in their native language. Consider including translations to make your app multilingual'
    }
  }
];

const alertRules: IRule[] = [{
    name: 'Alerts Signup',
    condition: {
      metadataType: 'any',
      operator: 'always'
    },
    resultTrue: {
      label: 'Stay on Top of Alerts',
      message: 'Sign up here to be notified of all Partner Alerts',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000FtFWqQAN'
    }
  },
  {
    name: '@AuraEnabled Methods',
    condition: {
      metadataType: 'ApexClass.AuraEnabledCalls',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z',
      showDetails: true
    },
    resultTrue: {
      label: '@AuraEnabled Methods',
      message: 'New Permissions Required to Access Apex Classes containing @AuraEnabled methods.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB',  
      showDetails: true
    }    
  },
  {
    name: 'Aura UI Namespace',
    condition: {
      metadataType: 'componentProperties.AuraDefinitionBundle.*.namespaceReferences.ui',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z',
      showDetails: true
    },
    resultTrue: {
      label: 'Aura Components in UI Namespace Retiring in Summer \'21',
      message: 'In Summer \'21, Lightning Base Components in the ui namespace will be retired.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GXNKsQAP',
      showDetails: true
    }
  },
  {
    name: 'Custom Metadata Permissions',
    condition: {
      metadataType: 'CustomMetadata',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      label: 'Custom Metadata',
      message: 'New Permissions Required for Direct Read Access to Custom Metadata Types.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GimUSQAZ',
    }
  },
  {
    name: 'Custom Settings Direct Read',
    condition: {
      metadataType: 'CustomSetting__c',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      label: 'Custom Settings',
      message: 'New Permissions Required for Direct Read Access to Custom Settings.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GimQ6QAJ',
    }
  },
  {
    name: 'Territory 1 EOL',
    condition: {
      metadataType: 'Territory',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      label: 'Territory Management 1.0',
      message: 'Territory Management will be End of Life starting in Winter \'20. Please migrate to Territory Management 2.0.',
      url: 'https://help.salesforce.com/articleView?id=000318370&type=1&mode=1',
    }
 },
 {
    name: 'RecordType Access',
    condition: {
      metadataType: 'RecordType',
      operator: 'exists',
      expiration: '2020-05-01T00:00:00.000Z'
    },
    resultTrue: {
      label: 'Change to Record Type Access',
      message: 'There have been changes to Record Type access in permission sets within Managed Packages for Winter \'20 in response to a Known Issue. Subscribers may need to upgrade your package to see this fix.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GSdBoQAL',
    }
 },
 {
    name: 'Lightning Platform API Versions 7-20',
    condition: {
      metadataType: 'apiVersions.*.*',
      operator: 'between',
      operand: [7,20],
    },
    resultTrue: {
      label: 'Lightning Platform API Versions 7-20 Retiring in Summer ‘21',
      message: 'With the Summer ‘21 release, SOAP, REST, and Bulk API legacy versions 7 through 20 will be retired and no longer supported by Salesforce. When these legacy versions are retired, applications consuming impacted versions of the APIs will experience a disruption as the requests will fail and result in an error indicating that the requested endpoint has been deactivated.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GXNIDQA5'
    }
 },
 {
    name: 'External Sharing Model set to Private for all entities',
    condition: {
      expiration: '2020-07-1T00:00:00.000Z',
      metadataType: 'any',
      operator: 'always'
    },
    resultTrue: {
      label: 'All new orgs will sign up with External Sharing Model set to Private for all entities in Spring’20',
      message: 'The external sharing model is automatically enabled in Salesforce orgs created in Spring ’20 or after. Also, external access levels are initially set to Private for all objects in these orgs. These changes don’t affect existing customers.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GNnm3QAD'
    }
 },
 {
   name: 'Enhancement to Guest User Sharing Policy',
   condition: {
    metadataType: 'LightningComponentBundle.targets.lightningCommunity__Page',
    operator: 'exists',
    conditionOr: {
      metadataType: 'LightningComponentBundle.targets.lightningCommunity__Default',
      operator: 'exists',
      conditionOr: {
        metadataType: 'ExperienceBundle',
        operator: 'exists',
        conditionOr: {
          metadataType: 'CommunityTemplateDefinition',
          operator: 'exists',
          conditionOr: {
            metadataType: 'componentProperties.AuraDefinitionBundle.*.interfaces.forceCommunity:availableForAllPageTypes',
            operator: 'exists',
            conditionOr: {
              metadataType: 'componentProperties.ApexPage.*.RefersToSite',
              operator: 'exists',
              conditionOr: {
                metadataType: 'componentProperties.ApexTrigger.*.RefersToGuest',
                operator: 'exists',
                conditionOr: {
                  metadataType:  'componentProperties.ApexClass.*.RefersToGuest',
                  operator: 'exists'
                }
              }
            }
          }
        }
      }
    }
  },
  resultTrue: {
    label: 'Enhancement to Guest User Sharing Policy',
    message: 'The secure guest user record access and assign new records created by guest users to the default owner will be auto-enabled in Summer ‘20 with opt-out & disable options available. The settings will be enforced in Winter ‘21 without opt-out & disable options. If your application uses or can use Guest Users, please refer to this alert link to ensure you will not be impacted.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GNp0vQAD'
  }
 }
];

const editionWarningRules: IInstallRule[] = [{
  name: 'Essentials',
  blockingItems: [{
      label: 'Record Types',
      condition: {
        metadataType: 'RecordType',
        operator: 'exists'  
      }
    },
    {
      label: 'Person Accounts',
      condition: {
        metadataType: 'dependencies.features.PersonAccount',
        operator: 'exists'
      }
    },
    {
      label: 'Classes with Invocable Apex',
      condition: {
        metadataType: 'ApexClass.InvocableApex',
        operator: 'exists'
      }
    },
    {
      label: 'Platform Events',
      condition: {
        metadataType: 'PlatformEventChannel',
        operator: 'exists'
      }
    },
    {
      label: 'Custom Profiles',
      condition: {
        metadataType: 'Profile',
        operator: 'exists'  
      }
    },
    {
      label: 'Sharing Rules',
      condition: {
        metadataType: 'SharingRules',
        operator: 'exists'  
      }
    },
    {
      label: 'Flows per Type',
      condition: {
        metadataType: 'Flow.FlowTypes.*',
        operator: 'gt',
        operand: 5
      }
    }

  ]
},
{
  name: 'Group Edition',
  blockingItems: [{
      label: 'Record Types',
      condition: {
        metadataType: 'RecordType',
        operator: 'exists'  
      }
    },
    {
      label: 'Person Accounts',
      condition: {
        metadataType: 'PersonAccount__c',
        operator: 'exists'
      }
    },
    {
      label: 'Custom Report Types',
      condition: {
        metadataType: 'ReportType',
        operator: 'exists'  
      }
    },
    {
      label: 'Classes with SOAP Apex Web Services',
      condition: {
        metadataType: 'ApexClass.ApexSoap',
        operator: 'exists'  
      }
    },
    {
      label: 'Custom Profiles',
      condition: {
        metadataType: 'Profile',
        operator: 'exists'  
      }
    },
    {
      label: 'Sharing Rules',
      condition: {
        metadataType: 'SharingRules',
        operator: 'exists'  
      }
    },
    {
      label: 'Flows per Type',
      condition: {
        metadataType: 'Flow.FlowTypes.*',
        operator: 'gt',
        operand: 5
      }
    }
  ]
},
{
  name: 'Professional Edition',
  blockingItems: [{
    label: 'Classes with SOAP Apex Web Services',
    condition: {
      metadataType: 'ApexClass.ApexSoap',
      operator: 'exists'  
    }
    },
    {
      label: 'Custom Report Types',
      condition: {
        metadataType: 'ReportType',
        operator: 'gt',
        operand: 50 
      }
    },
    {
      label: 'Flows per Type',
      condition: {
        metadataType: 'Flow.FlowTypes.*',
        operator: 'gt',
        operand: 5
      }
    }
  ]
},
{
  name: 'Enterprise Edition',
  blockingItems: [{
    label: 'Custom Report Types',
    condition: {
      metadataType: 'ReportType',
      operator: 'gt',
      operand: 100 
    }
  },
 ]
},
];

const techAdoptionRules: ITechAdoptionRule[] = [
  {
    categoryName: 'DataStore',
    categoryLabel: 'Which platform technology does your application use as its primary data store?',
    items: [
      {
        metadataType: 'CustomObject',
        label: 'Custom Objects'
      }
    ]
  },
  {
    categoryName: 'DataProcess',
    categoryLabel: 'Which other platform technologies does your application use to process and store data?',
    items: [
      {
        metadataType: 'CustomObject',
        label: 'Custom Objects'
      },
      {
        metadataType: 'CustomObject.BigObject',
        label: 'Big Objects'
      },
      {
        metadataType: 'PlatformEvent__c',
        label: 'Platform Events'     
      },
      {
        metadataType: 'PlatformEventChannel',
        label: 'Change Data Capture'     
      }
    ]
  },
  {
    categoryName: 'UX',
    categoryLabel: 'Which user interface technologies does your application use to deliver the end-user experience?',
    items: [
      {
        metadataType: 'LightningComponentBundle',
        label: 'Lightning Web Components',
      },
      {
        metadataType: 'AuraDefinitionBundle',
        label: 'Aura Lightning Components',
      },
      {
        metadataType: 'ApexPage',
        label: 'Visualforce Pages',
      }
    ]
  },
  {
    categoryName: 'ApplicationProcessing',
    categoryLabel: 'Which technologies does your app use for application processing and security?',
    items: [
      {
        metadataType: 'Flow.FlowTypes.Workflow',
        label: 'Process Builder',
      },
      {
        metadataType: 'Flow.FlowTypes.Flow',
        label: 'Screen Flows',
      },
      {
        metadataType: 'Flow.FlowTypes.AutoLaunchedFlow',
        label: 'Autolaunched Flows',
      },
      {
        metadataType: 'ApexClass',
        label: 'Apex',
      },
      {
        metadataType: 'PlatformCachePartition',
        label: 'Platform Cache',
      }
    ]
  }
];

const dependencyRules: IDependecyRule[] = [{
  name: 'CommunityCloud',
  label: 'Community Cloud',
  condition: {
    metadataType: 'LightningComponentBundle.targets.lightningCommunity__Page',
    operator: 'exists',
    conditionOr: {
      metadataType: 'LightningComponentBundle.targets.lightningCommunity__Default',
      operator: 'exists',
      conditionOr: {
        metadataType: 'ExperienceBundle',
        operator: 'exists',
        conditionOr: {
          metadataType: 'CommunityTemplateDefinition',
          operator: 'exists',
          conditionOr: {
            metadataType: 'componentProperties.AuraDefinitionBundle.*.interfaces.forceCommunity:availableForAllPageTypes',
            operator: 'exists'
          }
        }
      }
    }
  }
},
{
    name: 'PersonAccount',
    label: 'Person Accounts',
    condition: {
      metadataType: 'dependencies.features.PersonAccount',
      operator: 'exists'
    }
},
{
  name: 'EinsteinAnalytics',
  label: 'Einstein Analytics',
  condition: {
    metadataType: 'WaveApplication',
    operator: 'exists',
    conditionOr: {
      metadataType: 'WaveDataflow',
      operator: 'exists',
      conditionOr: {
        metadataType: 'WaveDashboard',
        operator: 'exists',
        conditionOr: {
          metadataType: 'WaveDataset',
          operator: 'exists',
          conditionOr: {
            metadataType: 'WaveLens',
            operator: 'exists',
            conditionOr: {
              metadataType: 'WaveRecipe',
              operator: 'exists',
              conditionOr: {
                metadataType: 'WaveTemplateBundle',
                operator: 'exists',
                conditionOr: {
                  metadataType: 'WaveXmd',
                  operator: 'exists'
                }
                }
              }
            }
          }
        }
    }
  }
}
]

const dataModels: IDataModel[] = [{
  name: 'work.com',
  label: 'Work.com',
  namespaces: ['wkcc'],
  objects: ['Employee','EmployeeCrisisAssessment','InternalOrganizationUnit','Crisis'],
  fields: ['Location.Status__c']
},
{
  name: 'healthcloud',
  label: 'Health Cloud',
  namespaces: ['HealthCloudGA','HealthCloudWave'],
  objects: ['Accreditation','BoardCertification','CareBarrier','CareBarrierDeterminant','CareBarrierType','CareDeterminant','CareDeterminantType','CareDiagnosis','CareInterventionType','CarePreauth','CarePreauthItem','CareProgram','CareProgramCampaign','CareProgramEligibilityRule','CareProgramEnrollee','CareProgramEnrolleeProduct','CareProgramEnrollmentCard','CareProgramGoal','CareProgramProduct','CareProgramProvider','CareProgramTeamMember','CareProviderAdverseAction','CareProviderFacilitySpecialty','CareProviderSearchableField','CareRequest','CareRequestDrug','CareRequestExtension','CareRequestItem','CareSpecialty','CareTaxonomy','CoverageBenefit','CoverageBenefitItem','EnrollmentEligibilityCriteria','HealthCareDiagnosis','HealthcareFacilityNetwork','HealthcarePayerNetwork','HealthcarePractitionerFacility','HealthCareProcedure','HealthcareProvider','HealthcareProviderNpi','HealthcareProviderSpecialty','HealthcareProviderTaxonomy','MemberPlan','PlanBenefit','PlanBenefitItem','PurchaserPlan','PurchaserPlanAssn']
},
]

export {
  mdTypes,
  enablementRules,
  editionWarningRules,
  alertRules,
  qualityRules,
  minAPI,
  techAdoptionRules,
  rulesVersion,
  dependencyRules,
  dataModels,
  standardNamespaces
};





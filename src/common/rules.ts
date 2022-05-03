/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const minAPI = 48;

const rulesVersion = '20220418';

const standardNamespaces = [
  'c',
  'aura',
  'lightning',
  'ui',
  'apex',
  'ltng',
  'force'
];

//See  https://github.com/get-alex/alex#configuration for more information on how to configure the Language Scanner
const alexConfig = {
  "noBinary": true,
  "profanitySureness": 2,
  "allow": ["period","simple","invalid","special","just","fires","host-hostess","gross","executes","execution","KY"]
}

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
},
{
  label: 'In-App guidance',
  metadataType: 'Prompt'
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
    name: 'SFDXScanner',
    condition: {
      metadataType: 'ApexClass',
      operator: 'exists',
      conditionOr: {
        metadataType: 'ApexTrigger',
        operator: 'exists',
        conditionOr: {
          metadataType: 'LightningComponentBundle',
          operator: 'exists',
          conditionOr: {
            metadataType: 'AuraDefinitionBundle',
            operator: 'exists',
            conditionOr: {
              metadataType: 'ApexPage',
              operator: 'exists'
            }
          }
        }
      }
    },
    resultTrue: {
      label: 'Scan your code for vulnerabilities',
      message: 'Scan your Apex, Javascript, and Visualforce code for vulnerabilities and violations using the sfdx-scanner plugin. Learn more about sfdx-scanner here.',
      url: 'https://forcedotcom.github.io/sfdx-scanner/'
    },
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
    name: 'FlowsLimitations',
    condition: {
      metadataType: 'Flow',
      operator: 'exists',
    },
    resultTrue: {
      label: 'Be aware of packaging limitations for Flows',
      message: 'There are limitations on Flows within packages. Please review the following document before packaging your flow.',
      url: 'https://help.salesforce.com/articleView?id=flow_considerations_distribute_package.htm'
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
      label: 'Supercharge Your App’s Performance with Free Platform Cache',
      message: 'As part of the partner program and, with the Spring ’21 release, ISVs can now include that 3MB of platform cache into their managed packages. Check out this blog to see how the free cache provisioning works and what you need to do to take advantage of it.',
      url: 'http://bit.ly/ISVTEPlatformCache'
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
    name: 'Lightning Web Components Performance Best Practices',
    condition: {
      metadataType: 'LightningComponentBundle',
      operator: 'exists'
    },
    resultTrue: {
      label: 'Lightning Web Components Performance Best Practices',
      message: 'Check out this blog for tips, tricks and best practices to get the best performance out of your Lightning Web Components',
      url: 'https://developer.salesforce.com/blogs/2020/06/lightning-web-components-performance-best-practices.html'
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
  },
  {
    name: '@AuraEnabled Critical Update',
    condition: {
      metadataType: 'ApexClass.AuraEnabledCalls',
      operator: 'gt',
      operand: 0
    },
    resultTrue: {
      label: 'Learn about @AuraEnabled Permissions',
      message: 'A Winter \'21 Critical update changed the permissions needed for users to access @AuraEnabled methods. See the blog below for more information',
      url: 'https://developer.salesforce.com/blogs/2020/08/breezing-through-the-upcoming-auraenabled-critical-update.html?utm_campaign=August_2020&utm_source=social&utm_medium=twitter&utm_source=twitter&utm_medium=organic_social&utm_campaign=amer_sfld&utm_content=AMER%2CDevelopers%2CEnglish'
    }
  },
];

const qualityRules: IRule[] = [
  {
    name: "PB Workflow Disablement",
    condition: {
      metadataType: "Flow.FlowTypes.Workflow",
      operator: 'exists',
      conditionOr: {
        metadataType: "Workflow",
        operator: 'exists',
        conditionOr: {
          metadataType: "WorkflowFieldUpdate",
          operator: 'exists',
          conditionOr: {
            metadataType: "WorkflowAlert",
            operator: 'exists',
            conditionOr: {
              metadataType: "WorkflowRule",
              operator: 'exists'
            }
          }
        }
      }
    },
    resultTrue: {
      label: 'Process Builder and Workflow Rules being retired', 
      message: 'Process Builders and Workflow Rules are being retired in favour of Flow. Read the information here for more details on the disablement timeline.',
      url: 'https://admin.salesforce.com/blog/2021/go-with-the-flow-whats-happening-with-workflow-rules-and-process-builder',
    }
  },
  {
    name: 'Hard-Coded URLs',
    condition: {
      metadataType: 'componentProperties.*.*.hardcodedURLs',
      operator: 'exists',
      showDetails: true

    },
    resultTrue: {
      label: 'Do Not use Hard-Coded URLs to access Salesforce Orgs',
      message: 'Hard-Coded URLs which reference instance names like https://na144.salesforce.com can cause customer org migrations to fail. Use <mydomain>.my.salesforce.com or login.salesforce.com instead',
      url: 'https://help.salesforce.com/s/articleView?id=000335670&type=1',
      showDetails: true

    }
  },
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
  },
  {
    name: 'ApexCode',
    condition: {
      metadataType: 'ApexClass.CharacterCount',
      operator: 'gt',
      operand: 5000000
    },
    resultTrue: {
      label: 'Large amounts of Apex',
      message: 'Total Apex Character count not counting tests and comments is close to the 6M character limit'
    }
  },
  {
    name: 'PackagedConsumerKey',
    condition: {
      metadataType: 'componentProperties.AuthProvider.*.packagedSecret',
      operator: 'gte',
      operand: 1,
      showDetails: true
    },
    resultTrue: {
      label: 'Sensitive value cannot be packaged',
      message: 'Starting **RELEASE*** an AuthProvider can no longer be packaged with a consumer key. The key must be configured post installation. See here for more information:',
      url: 'https://help.salesforce.com/THELINK',
      showDetails: true
    }
  },
  {
    name: 'OverloadedAuraEnabled',
    condition: {
      metadataType: 'componentProperties.ApexClass.*.AuraEnabledMethods',
      operator: 'exists',
      showDetails: true,
      conditionAnd: {
        metadataType: 'apiVersions.ApexClass.*',
        operator: 'gte',
        operand: 55,
        conditionPerItem: true,
        showDetails: true   
      }
    },
    resultTrue: {
      label: 'Overloaded AuraEnabled Calls',
      message: 'Starting with API Version 55, @AuraEnabled methods cannot be overloaded',
      showDetails: true
    }
  }
];

const alertRules: IRule[] = [
  {
    name: 'Alerts Signup',
    condition: {
      metadataType: 'any',
      operator: 'always'
    },
    resultTrue: {
      label: 'Stay on Top of Alerts',
      message: 'Sign up here to be notified of all Partner Alerts',
      url: 'https://sfdc.co/ISVTEAlertsAll'
    }
  },
  {
    name: '@AuraEnabled Methods',
    condition: {
      metadataType: 'ApexClass.AuraEnabledCalls',
      operator: 'exists',
      expiration: '2021-05-01T00:00:00.000Z',
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
      expiration: '2021-08-01T00:00:00.000Z',
      showDetails: true
    },
    resultTrue: {
      label: 'Aura Components in UI Namespace Retiring in Summer \'21',
      message: 'In Summer \'21, Lightning Base Components in the ui namespace will be retired.',
      url: 'https://sfdc.co/ISVTEAlert20191210',
      showDetails: true
    }
  },
  {
    name: 'Custom Metadata Permissions',
    condition: {
      metadataType: 'CustomMetadata',
      operator: 'exists',
      expiration: '2021-05-01T00:00:00.000Z'
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
      expiration: '2021-05-01T00:00:00.000Z'
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
      expiration: '2021-07-01T00:00:00.000Z'
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
      expiration: '2021-08-1T00:00:00.000Z',
      operator: 'between',
      operand: [7,20],
    },
    resultTrue: {
      label: 'Lightning Platform API Versions 7-20 Retiring in Summer ‘21',
      message: 'With the Summer ‘21 release, SOAP, REST, and Bulk API legacy versions 7 through 20 will be retired and no longer supported by Salesforce. When these legacy versions are retired, applications consuming impacted versions of the APIs will experience a disruption as the requests will fail and result in an error indicating that the requested endpoint has been deactivated.',
      url: 'https://sfdc.co/ISVTEAlert20200120'
    }
 },
 {
  name: 'Salesforce Platform API Versions 21.0 thru 30.0 in Summer 22',
  condition: {
    metadataType: 'apiVersions.*.*',
    expiration: '2022-008-1T00:00:00.000Z',
    operator: 'between',
    operand: [5,30],
  },
  resultTrue: {
    label: 'Salesforce Platform API Versions 21.0 thru 30.0 in Summer \'22',
    message: 'With the Summer ‘22 release, SOAP, REST, and Bulk API legacy versions 21 through 30 will be retired and no longer supported by Salesforce. When these legacy versions are retired, applications consuming impacted versions of the APIs will experience a disruption as the requests will fail and result in an error indicating that the requested endpoint has been deactivated.',
    url: 'https://sfdc.co/ISVTEAlert20201109'
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
    expiration: '2021-05-1T00:00:00.000Z',
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
    url: 'https://sfdc.co/ISVTEAlert20200414'
  }
 },
 {
  name: 'Enhancement to Guest User Sharing Policy',
  condition: {
   expiration: '2021-05-1T00:00:00.000Z',
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
   label: 'Upcoming Enforcing Changes Affecting Guest User Object Permissions',
   message: 'As part of the new Guest User Security Policy for Salesforce public sites, Salesforce will permanently remove several guest user object permissions with the Spring 21 release. The object permissions due to be removed are: Edit, Delete, Modify All, & View All. These permissions will be permanently removed for custom objects and standard objects. Major impact will be seen on standard objects - Order, Survey Response, Contract, ProfileSkillUser, and ProfileSkillEndorsement, and all custom objects.',
   url: 'https://sfdc.co/ISVTEAlert20201215'
 }
},
{
  name: 'Work.com Search',
  condition: {
    expiration: '2021-10-1T00:00:00.000Z',
    metadataType: 'dependencies.namespaces.wkcc',
    operator: 'exists'
  },
  resultTrue: {
    label: 'Changing the Location Search Filter Level setting in Command Center, by administrators, may impact Work.com Components',
    message: 'With the v5 of Workplace Command Center, Salesforce provides System Administrators with the option of allowing end users to search all levels of the location hierarchy. In previous versions, and by default in Version 5, end users can search only level-1 locations. Not all components running in Workplace Command Center fully support the option to search locations at all levels of the hierarchy. The components that support search at all levels are: Wellness Status, Wellness Status by Location, Location Status, and Operations Feed (tasks).',
    url: 'https://sfdc.co/ISVTEAlert20201207'
  }
},
{
  name: 'New Order Save Behavior',
  condition: {
    metadataType: 'ApexTrigger.object.Order',
    operator: 'exists',
    conditionOr: {
      metadataType: 'ApexTrigger.object.OrderItem',
      operator: 'exists',
      conditionOr: {
        metadataType: 'Flow.object.Order',
        operator: 'exists',
        conditionOr: {
          metadataType: 'Flow.object.OrderItem',
          operator: 'exists',
        },
      },
    },

  },
  resultTrue: {
    label: 'New Order Save Behavior',
    message: 'To align with Force.com platform requirements, we’re updating the Order Save Behavior feature starting with the Winter ’21 release. This update improves the evaluation of custom application logic on the parent record. Unlike the previous version, the New Order Save Behavior makes Salesforce run custom application logic whenever an order product update causes a change to the parent order. Custom application logic consists of validation rules, Apex triggers, workflow rules, flows, and processes.',
    url: 'https://sfdc.co/ISVTEAlert20200925'
  }
},
  {
      name: "Lightning Platform Components Proactive Enablement",

      condition: {
        expiration: '2021-10-01T00:00:00.000Z',
        metadataType: "LightningComponentBundle",
        operator: "exists",
        conditionOr: {
          metadataType: "AuraDefinitionBundle",
          operator: "exists",
        }
      },
      resultTrue: {
        label: "Access Security Changes to Lightning Platform Components Proactive Enablement",
        message: "During the Summer ‘21 release, Salesforce will be automatically enforcing the Disable Access to Non-global Apex Controller Methods in Managed Packages and Enforce Access Modifiers on Apex Properties in Lightning Component Markup release updates. View the alert to understand the changes and prepare for their impact.",
        url: "https://sfdc.co/ISVTEAlert20210209"
      }

  },
  {
    name: 'MFA Mandate',
    condition: {
      expiration: '2022-03-1T00:00:00.000Z',
      metadataType: 'any',
      operator: 'always'
    },
    resultTrue: {
      label: 'MFA Mandate - Alert to All Partners (w/ emphasis on OEM/reseller partners)',
      message: 'Beginning February 1, 2022, all users will be required to adopt Multi-Factor Authentication (MFA) to login to Salesforce products, including OEM products and Salesforce products purchased through a reseller.',
      url: 'https://sfdc.co/ISVTEAlert20210202'
    }
 },
 {name: 'Stricter Validation in Visualforce Remoting API',
 condition: {
   expiration: '2021-12-1T00:00:00.000Z',
   metadataType: 'ApexClass.RemoteActionCalls',
   operator: 'exists'
 },
 resultTrue: {
   label: 'Stricter Validation in Visualforce Remoting API',
   message: 'To ensure that the Visualforce Remoting API is properly secured, calls now have stricter validation. This update is enforced in Winter \'22. Click here to find out more',
   url: 'https://sfdc.co/ISVTEremotingupdate'}
 },
 {
   name: 'Candidate Patient Entity Retirement',
   condition: {
     expiration: '2022-08-1T00:00:00.000Z',
     metadataType: 'dependencies.components.HealthCloudGA__CandidatePatient__c',
    operator: 'exists',
    conditionOr: {
      metadataType: 'ApexTrigger.objects.HealthCloudGA__CandidatePatient__c',
      operator: 'exists',
      conditionOr: {
        metadataType: 'Flow.objects.HealthCloudGA__CandidatePatient__c',
        operator: 'exists',
        conditionOr: {
          metadataType: 'CustomField.objects.HealthCloudGA__CandidatePatient__c',
          operator: 'exists'
        }
      }
    }
    },
    resultTrue: {
      label: 'Health Cloud “Candidate Patient” data entity retirement',
      message: 'We are planning to retire the Health Cloud “Candidate Patient” data entity with the Spring ‘22* release and we recommend that you use the Lead object by that time.',
      url: 'https://sfdc.co/ISVTEAlertCandidatePatient'
    }
 },
 {
 name: 'Alerts Signup',
 condition: {
  metadataType: 'Aura notexist',
  operator: 'notexists',
  conditionAnd: {
    processAlways: false,
    metadataType: 'lightning exist',
    operator: 'exists'
  }
},
 resultTrue: {
   label: 'Lighting Web Security is generally available for Lighting web components',
   message: 'Lightning Web Security is a new client-side security architecture for Lightning web components. This new architecture is defined by fewer restrictions and more functionality while providing strong sandboxing and a security posture to enforce namespace isolation',
   url: 'https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8O&fId=0D54V000062z8QZ'
 }
},
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
      label: 'Platform Cache',
      condition: {
        metadataType: 'PlatformCachePartition',
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
    categoryName: 'UX',
    categoryLabel: 'User Experience',
    technologies: [
      {
        name: 'Lightning Web Components',
        question: 'Does your application metadata contain Lightning web components?',
        points: 10,
        condition: {
            metadataType: 'LightningComponentBundle',
            operator: 'exists'
          },
        levelUp: {
          label: 'Take advantage of Lightning Web Components',
          message: 'Find more information about how to leverage the power of LWC and for best practices, see this webinar.',
          url: 'https://partners.salesforce.com/0693A000007Kd7oQAC'
        }
      },
      {
        name: 'Lightning Flow',
        question: 'Does your application metadata contain Lightning Flows?',
        points: 10,
        condition: {
            metadataType: 'Flow',
            operator: 'exists'
          },
        levelUp: {
          label: 'Take Advantage of Flows',
          message: 'Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.',
          url: 'https://partners.salesforce.com/0693A000007S2Dq'
        }
      }
    ]
  },
  {
    categoryName: 'Analytics',
    categoryLabel: 'Analytics & Einstein',
    technologies: [
      {
        name: 'Reports and Dashboards',
        question: 'Does your application metadata contain custom reports or dashboards?',
        points: 7,
        condition: {
            metadataType: 'Report',
            operator: 'exists',
            conditionOr: {
              metadataType: 'ReportType',
              operator:'exists',
              conditionOr: {
                metadataType: 'Dashboard',
                operator: 'exists'
              }
            }
          }
      },
      {
        name: 'TableauCRM',
        question: 'Does your application metadata contain custom analytics implemented using Tableau CRM (formerly Einstein Analytics)?',
        points: 10,
        levelUp: {
          label: 'Tableau CRM on Trailhead',
          message: 'Start here to learn how to use TableauCRM in your application',
          url: 'https://sfdc.co/ISVTETCMGetStarted'
        },
        condition: {
            metadataType: 'WaveTemplateBundle',
            operator: 'exists',
            conditionOr: {
              metadataType: 'WaveApplication',
              operator: 'exists',
              conditionOr: {
                metadataType: 'WaveDashboard',
                operator: 'exists',
                conditionOr: {
                  metadataType: 'WaveDataflow',
                  operator: 'exists',
                  conditionOr: {
                    metadataType: 'WaveDataset',
                    operator: 'exists',
                    conditionOr: {
                      metadataType: 'WaveLens',
                      operator: 'exists'
                    }
                  }
                }
              }
            }
          },

      },
      {
        name: 'Einstein Predictions',
        question: 'Does your application metadata contain predictions using Einstein Prediction Builder or Einstein Discovery?',
        points: 9,
        levelUp: {
          label: 'Einstein Prediction Builder on Trailhead',
          message: 'Start here to learn how to use Einstein Prediction Builder and Einstein Discovery in your application',
          url: 'https://sfdc.co/ISVTEPredictionBuilder'
        },
        condition: {
            metadataType: 'AIApplication',
            operator: 'exists',
            conditionOr: {
              metadataType: 'MLPredictionDefinition',
              operator:'exists',
              conditionOr: {
                metadataType: 'MLDataDefinition',
                operator: 'exists'
              }
            }
          }
      },
      {
        name: 'Next Best Action',
        question: 'Does your application metadata contain Next Best Actions to surface recommendations to end users?',
        points: 7,
        levelUp: {
          label: 'Next Best Action on Trailhead',
          message: 'Start here to learn how to use Einstein Next Best Actions in your application',
          url: 'https://sfdc.co/ISVTENBA'
        },
        condition: {
            metadataType: 'RecordActionDeployment',
            operator: 'exists',
            
          }
      },
    ]
  },
  {
    categoryName: 'Processing and Platform',
    categoryLabel: 'Data Storage & Processing',
    technologies: [
      {
        name: 'Experience Cloud',
        question: 'Does your application metadata contain Lightning Web Components which are rendered on Experience Cloud?',
        points: 7,
        levelUp: {
          label: 'Learn more about Experience Cloud',
          message: 'Start here to learn more about how to use Experience Cloud in your applicatin',
          url: 'https://trailhead.salesforce.com/en/content/learn/trails/communities'
        },
        condition: {
          metadataType: 'LightningComponentBundle.targets.lightningCommunity__Page',
          operator: 'exists',
          conditionOr: {
            metadataType: 'LightningComponentBundle.targets.lightningCommunity__Default',
            operator: 'exists'
          }
        }
      },
      {
        name: 'Apex',
        question: 'Does your application metadata contain Apex?',
        points: 7,
        condition: {
          metadataType: 'ApexClass',
          operator: 'exists',
          conditionOr: {
              metadataType: 'ApexTrigger',
              operator: 'exists'
          }
        }
      },
      {
        name: 'Custom Objects',
        question: 'Does your application metadata contain Custom Objects?',
        points: 7,
        condition: {
            metadataType: 'CustomObject',
            operator: 'exists'
        }
      },
      {
        name: 'Platform Cache',
        question: 'Does your application metadata contain the free Platform Cache for ISVs?',
        points: 9,
        condition: {
          metadataType: 'PlatformCachePartition',
          operator: 'exists'
        },
        levelUp: {
          label: 'Supercharge Your App’s Performance with Free Platform Cache',
          message: 'As part of the partner program and, with the Spring ’21 release, ISVs can now include that 3MB of platform cache into their managed packages. Check out this blog to see how the free cache provisioning works and what you need to do to take advantage of it.',
          url: 'http://bit.ly/ISVTEPlatformCache'
        }
      },
      {
        name: 'Shield',
        question: 'Is your application compatible with Shield Platform Encryption?',
        points: 7,
        levelUp: {
          label: 'Platform Encryption for ISVs',
          message: 'Learn how to test your app against Shield Plaftorm Encryption',
          url: 'http://bit.ly/ISVTEPlatformEncryption'
        }
      },
      
      
    ]
  },
  {
    categoryName: 'Dev and Deploy',
    categoryLabel: 'Development & Deployment',
    technologies: [
      {
        name: 'Trialforce',
        question: 'Are you using trialforce technologies to provide free trials for your customers?',
        points: 10,
        levelUp: {
          label: 'Deliver Trials with Trialforce',
          message: 'Learn how to use Trialforce to allow your prospects to try your application',
          url: 'https://sfdc.co/ISVTETrialforce'
        }
      },
      {
        name: '2GP Packaging',
        question: 'Is your metadata stored in a second-generation managed package (2GP)?',
        points: 10,
        levelUp: {
          label: '2GP Deep Dive Trailmix',
          message: 'Learn more about Second Generation Packaging and how to get started with this 2GP Deep Dive Trailmix',
          url: 'http://sfdc.co/deep-dive-2gp'
        }
      },
      {
        name: 'LDV/Enterprise Scale Testing',
        question: 'Have you requested an LDV (Large Data Volume) test org and executed performance testing by opening up a case?',
        points: 10,
        levelUp: {
          label: 'Test for Scale',
          message: 'Test your app for large data volumes to when your potential customers include large enterprises',
          url: 'https://sfdc.co/ISVTELargeData'
        }
      },
      {
        name: 'Partner Intelligence',
        question: 'Do you use AppExchange App Analytics to track the usage of any of your published apps?',
        points: 10,
        levelUp: {
          label: 'Gain insight with Partner Intelligence',
          message: 'Discover how subscribers interact with your package by exploring App Analytics data.',
          url: 'https://bit.ly/AAGetStartedBlog'
        }
      },
      {
        name: 'Push Upgrades',
        question: 'Do you use Push Upgrades to push application changes to your subscriber orgs?',
        points: 10,
        levelUp: {
          label: 'Manage subscriber updates with Push Upgrades',
          message: 'Refer to these resources to understand and implement push upgrades for first and second-generation managed packages.',
          url: 'https://sfdc.co/ISVTEPushUpgrades'
        }
      },
      {
        name: 'DX/Scratch Orgs',
        question: 'Do you use scratch orgs when developing code or features for your managed packages?',
        points: 10,
        levelUp: {
          label: 'SalesforceDX for ISVs',
          message: 'Learn how ISVs can leverage Salesforce DX to build apps faster and with more agility than ever.',
          url: 'https://sfdc.co/ISVTESalesforceDXISVs'
        }
      }
    ]
  },
  {
    categoryName: 'Secondary Tech UX',
    categoryLabel: 'Secondary Technology: User Experience',
    technologies: [
      {
        name: 'Lightning Console',
        question: 'Does your application contain metadata that make your application components accessible in the  Lightning Console?',
        points: 5,
        levelUp: {
          label: 'Create a console App',
          message: 'Learn how to use Lightning Console Apps to improve productivity',
          url: 'https://sfdc.co/ISVTEConsoleApp'
        },
        condition: {
          metadataType: 'CustomApplication.LightningConsoleCount',
          operator: 'gt',
          operand: 0
        }
      },
      {
        name: 'Marketing Cloud - (Exact Target) specific UI',
        question: 'Have you created something manifested in the Marketing Cloud UI (not headless)?',
        points: 20,
      },
    ]
  },
  {
    categoryName: 'Processing and Platform',
    categoryLabel: 'Processing & Platform Adoption',
    technologies: [
      {
        name: 'Lightning Design System',
        question: 'Does your application use the Lightning Design System?',
        points: 5,
        levelUp: {
          label: 'Use SLDS',
          message: 'Learn how to use the Ligthning Design System in your App',
          url: 'https://sfdc.co/ISVTELDS'
        }
      },
      {
        name: 'Salesforce Mobile',
        question: 'Does your application metadata contain the Salesforce Mobile App OR have you built a native mobile app using Salesforce SDK?',
        points: 5,
        condition: {
          metadataType: 'BriefcaseDefinition',
          operator: 'exists', 
          conditionOr: {
            metadataType: 'MobileApplicationDetail',
            operator: 'exists'
          }
        },
        levelUp: {
          label: 'Optimize your app for Mobile',
          message: 'Learn more about making your app Mobile',
          url: 'https://sfdc.co/ISVTEMobile'
        }
      },
      {
        name: 'User Accessibility - Navigation',
        question: 'Can the page interactions be accessed via keyboard for people with limited ability to use a mouse?',
        points: 7,
        
        levelUp: {
          label: 'Get Started with Accessibility for Salesforce',
          message: 'Take this Trail to learn more about building accessible apps',
          url: 'https://sfdc.co/ISVTEAccessibilityTrail'
        }
      },
      {
        name: 'User Accessibility - Readability',
        question: 'Is the content robust enough that it can be interpreted by a wide variety of user agents, including assistive technologies?',
        points: 7,
        
        levelUp: {
          label: 'Learn more about Automated Accessibility Testing',
          message: 'Read more here about how to use sa11y to perform automated accessibility testing',
          url: 'https://sfdc.co/ISVTEsa11y'
        }
      }
    ]
  },
  {
    categoryName: 'Secondary Tech Analytics',
    categoryLabel: 'Secondary Technology: Analytics & Einstein',
    technologies: [
      {
        name: 'Einstein Recommendation Builder',
        question: 'Does your application contain metadata to surface recommendations based on intelligence built upon org historical data?',
        points: 5,
        condition: {
          metadataType: 'AIApplication',
          operator: 'exists',
          conditionOr: {
            metadataType: 'AIApplicationConfig',
            operator: 'exists'
          }
        }
      },
    ]
  },
  {
    categoryName: 'Secondary Tech Processing',
    categoryLabel: 'Secondary Technology: Data Storage & Processing',
    technologies: [
      {
        name: 'Salesforce Connect',
        question: 'Does your application metadata contain external objects?',
        points: 5,
        condition: {
          metadataType: 'CustomObject.ExternalObject',
          operator: 'exists'
        },
        levelUp: {
          label: 'Salesforce Connect',
          message: 'Learn more about using Salesforce Connect to interact with data outside a Salesforce Org',
          url: 'https://sfdc.co/ISVTEConnect'
        }
      },
      {
        name: 'Heroku',
        question: 'Have you built any part of your application on Heroku?',
        points: 5
      },
      {
        name: 'Platform Events',
        question: 'Does your application metadata contain Platform Events?',
        points: 5,
        condition: {
          metadataType: 'PlatformEvent__c',
          operator: 'exists'
        },
        levelUp: {
          label: 'Plaform Events on Trailhead',
          message: 'Learn more about Platform Events on Trailhead',
          url: 'https://sfdc.co/ISVTEPETrail'
        }
      },
      {
        name: 'Big Objects',
        question: 'Does your application metadata contain Big Objects?',
        points: 5,
        condition: {
          metadataType: 'CustomObject.BigObject',
          operator: 'exists'
        },
        levelUp: {
          label: 'Big Objects on Trailhead',
          message: 'Learn more about Big Objects on Traihead',
          url: 'https://sfdc.co/ISVTEBigObj'
        }
      }
    ]
  },
  {
    categoryName: 'Secondary Tech Development',
    categoryLabel: 'Secondary Technology: Development & Deployment',
    technologies: [
      {
        name: 'ISV Debugger',
        question: 'Have you used the ISV Debugger to troubleshoot an issue in a subscriber\'s org?',
        points: 7
      },
    ]
  },
  {
    categoryName: 'Secondary Tech Industry',
    categoryLabel: 'Secondary Technology: Cloud and Industry Adoption',
    technologies: [
      {
        name: 'CPQ',
        question: 'Does your application have a technical dependency on CPQ features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5
      },
      {
        name: 'Sales Cloud',
        question: 'Does your application have a technical dependency on Sales Cloud features that can only be accessed with a CRM User Permission Set License (PSL)?',
        points: 5
      },
      {
        name: 'Service Cloud',
        question: 'Does your application have a technical dependency on Service Cloud features that can only be accessed with a Service Cloud User Feature License?',
        points: 5
      },
      {
        name: 'Pardot',
        question: 'Does your application have a technical dependency on Pardot features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5,
        levelUp: {
          url: 'https://sfdc.co/ISVTEPardot',
          label: 'Pardot for ISVs',
          message: 'Learn more about how ISV partners can leverage Pardot for B2B Marketing Automation'
        }
      },
      {
        name: 'Commerce Cloud',
        question: 'Does your most recent B2C LINK integration release comply with the latest Certification Checklist?',
        points: 10
      },
      {
        name: 'Health Cloud',
        question: 'Does your application have a technical dependency on Health Cloud features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5,
        condition: {
          metadataType: 'dependencies.HealthCloud',
          operator: 'exists',
          conditionOr: {
            metadataType: 'dependencies.HealthCloudEHR',
            operator: 'exists'
          }
        }
      },
      {
        name: 'Marketing Cloud - Exact Target',
        question: 'Are you distributing your application via the install URL to customers (vs. sever-to-server)?',
        points: 20
      },
      {
        name: 'Marketing Cloud - Exact Target',
        question: 'Are you using Lightning Design Systems for a fluid user experience?',
        points: 20
      },
      {
        name: 'Consumer Goods Cloud',
        question: 'Does your application have a technical dependency on Consumer Goods Cloud features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5,
        condition: {
          metadataType: 'dependencies.CGCloud',
          operator: 'exists'
        }
      },
      {
        name: 'Financial Services Cloud',
        question: 'Does your application have a technical dependency on Financial Services Cloud features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5,
        condition: {
          metadataType: 'dependencies.FSC',
          operator: 'exists'
        }
      },
      {
        name: 'Manufacturing Cloud',
        question: 'Does your application have a technical dependency on Manufacturing Cloud features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5,
        condition: {
          metadataType: 'dependencies.MFGCloud',
          operator: 'exists'
        }
      },
      {
        name: 'Government Cloud',
        question: 'Is your application compatible with Government Cloud and Government Cloud Plus?',
        points: 5,
        levelUp: {
          label: 'Is your App Gov Cloud Ready?',
          message: 'Review the following guide to see if your app is ready for Govement Cloud and Government Cloud Plus',
          url: 'https://sfdc.co/GovCloudReady'
        }
      },
      {
        name: 'Field Service',
        question: 'Does your application have a technical dependency on Field Service features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5
      },
      {
        name: 'Commerce Cloud - Salesforce Commerce for B2B and/or B2C',
        question: 'Does your application have a technical dependency on the Salesforce Lightning B2B Commerce or Salesforce Lightning B2B2C Commerce that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 10
      },
      {
        name: 'Commerce Cloud - Salesforce Order Management',
        question: 'Does your application have a technical dependency on the Salesforce Lightning Order Management that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 10
      },
      {
        name: 'CDP',
        question: 'Does your application have a technical dependency on CDP features that can only be accessed via user Permission Set Licenses (PSL) assignment?',
        points: 5
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
  name: 'CDP',
  label: 'CDP',
  condition: {
    metadataType: 'DataStreamDefinition',
    operator: 'exists',
    conditionOr: {
      metadataType: 'ExternalDataConnector',
      operator: 'exists'
    }
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
  name: 'workcom',
  label: 'Work.com',
  namespaces: ['wkcc'],
  objects: ['Employee','EmployeeCrisisAssessment','InternalOrganizationUnit','Crisis'],
  fields: ['Location.Status__c']
},
{
  name: '1C',
  label: 'One Commerce',
  namespaces: ['CommercePayments','sfdc_checkout'],
  objects: ['Wishlist','WebStorePricebook','WebStoreCatalog','WebStoreBuyerGroup','WebStore','WebCart'],
  metadataTypes: ['Flow.FlowTypes.CheckoutFlow']
},
{
  name: 'SOM',
  label: 'Order Management',
  objects: ['FulfillmentOrder','FulfillmentOrderItemAdjustment','FulfillmentOrderItemTax','FulfillmentOrderLineItem','OrderAdjustmentGroupSummary','OrderDeliveryGroupSummary','OrderItemAdjustmentLineSummary','OrderItemSummary','OrderItemSummaryChange','OrderItemTaxLineItemSummary','OrderPaymentSummary','OrderSummary','ProcessException','ReturnOrder','ReturnOrderItemAdjustment','ReturnOrderItemTax','ReturnOrderLineItem','SalesChannel'],
  metadataTypes: ['dependencies.OrderManagementApex']
},
{
  name: 'B2B2C',
  label: 'B2B2C Commerce',
  namespaces: ['commerce'],
  objects:[]
},
{
  name: 'CGCloud',
  label: 'Consumer Goods Cloud',
  objects: ['AssessmentIndicatorDefinition','AssessmentTask','AssessmentTaskContentDocument','AssessmentTaskDefinition','AssessmentTaskIndDefinition','AssessmentTaskOrder','Assortment','AssortmentProduct','InStoreLocation','Promotion','PromotionChannel','PromotionProduct','PromotionProductCategory','RetailLocationGroup','RetailStore','RetailStoreKpi','RetailVisitKpi','StoreActionPlanTemplate','StoreAssortment','StoreProduct','Visit','Visitor','VisitedParty']
},
{
  name: 'ActionPlans',
  label: 'Action Plans',
  objects: ['ActionPlan','ActionPlanItem','ActionPlanTemplate','ActionPlanTemplateItem','ActionPlanTemplateItemValue','ActionPlanTemplateVersion']
},
{
  name: 'MFGCloud',
  label: 'Manufacturing Cloud',
  objects: ['AccountForecast','AccountForecastAdjustment','AccountForecastPeriodMetric','AccountProductForecast','AccountProductPeriodForecast','AcctMgrPeriodicTargetDstr','AcctMgrTarget','AcctMgrTargetDstr','AcctMgrTargetMeasure','SalesAgreement','SalesAgreementProduct','SalesAgreementProductSchedule']
},
{
  name: 'HealthCloud',
  label: 'Health Cloud',
  namespaces: ['HealthCloudGA','HealthCloudWave'],
  objects: ['Accreditation','BoardCertification','CareBarrier','CareBarrierDeterminant','CareBarrierType','CareDeterminant','CareDeterminantType','CareDiagnosis','CareInterventionType','CarePreauth','CarePreauthItem','CareProgram','CareProgramCampaign','CareProgramEligibilityRule','CareProgramEnrollee','CareProgramEnrolleeProduct','CareProgramEnrollmentCard','CareProgramGoal','CareProgramProduct','CareProgramProvider','CareProgramTeamMember','CareProviderAdverseAction','CareProviderFacilitySpecialty','CareProviderSearchableField','CareRequest','CareRequestDrug','CareRequestExtension','CareRequestItem','CareSpecialty','CareTaxonomy','CoverageBenefit','CoverageBenefitItem','EnrollmentEligibilityCriteria','HealthCareDiagnosis','HealthcareFacilityNetwork','HealthcarePayerNetwork','HealthcarePractitionerFacility','HealthCareProcedure','HealthcareProvider','HealthcareProviderNpi','HealthcareProviderSpecialty','HealthcareProviderTaxonomy','MemberPlan','PlanBenefit','PlanBenefitItem','PurchaserPlan','PurchaserPlanAssn']
},
{
  name: 'FSC',
  label: 'Financial Services Cloud',
  namespaces: ['FinServ'],
  objects: ['AccountParticipant','AuthorizedInsuranceLine','Award','BusinessLicense','BusinessMilestone','BusinessProfile','CaseGatewayRequest','Claim','ClaimCase','ClaimItem','ClaimParticipant','CoverageType','CustomerProperty','DistributorAuthorization','DocumentChecklistItem','DocumentType','Education','IdentityDocument','InsuranceClaimAsset','InsurancePolicy','InsurancePolicyAsset','InsurancePolicyCoverage','InsurancePolicyMemberAsset','InsurancePolicyParticipant','InsuranceProfile','LoanApplicant','LoanApplicantAddress','LoanApplicantAsset','LoanApplicantDeclaration','LoanApplicantEmployment','LoanApplicantIncome','LoanApplicantLiability','LoanApplicationAsset','LoanApplicationFinancial','LoanApplicationLiability','LoanApplicationProperty','LoanApplicationTitleHolder','OpportunityParticipant','ParticipantRole','PersonEducation','PersonLifeEvent','Producer','ProducerPolicyAssignment','ProductCoverage','ReciprocalRole','ResidentialLoanApplication','SecuritiesHolding','WealthAppConfig','WorkerCompCoverageClass' ]
},
{
  name: 'HealthCloudEHR',
  label: 'Health Cloud EHR Data Model',
  objects: ['HealthCloudGA__EhrAllergyIntolerance__c','HealthCloudGA__EhrCarePlan__c','HealthCloudGA__EhrCarePlanActivity__c','HealthCloudGA__EhrCarePlanConcern__c','HealthCloudGA__EhrCarePlanGoal__c','HealthCloudGA__EhrCarePlanParticipant__c','HealthCloudGA__EhrCondition__c','HealthCloudGA__EhrConditionRelatedItem__c','HealthCloudGA__EhrDevice__c','HealthCloudGA__EhrDosageInstruction__c','HealthCloudGA__EhrEncounter__c','HealthCloudGA__EhrEncounterAccommodation__c','HealthCloudGA__EhrEncounterParticipant__c','HealthCloudGA__EhrImmunization__c','HealthCloudGA__EhrImmunizationReaction__c','HealthCloudGA__EhrMedicationPrescription__c','HealthCloudGA__EhrMedicationStatement__c','HealthCloudGA__EhrObservation__c','HealthCloudGA__EhrPatient__c','HealthCloudGA__EhrPatientContact__c','HealthCloudGA__EhrPractitioner__c','HealthCloudGA__EhrPractitionerIdentity__c','HealthCloudGA__EhrPractitionerQualification__c','HealthCloudGA__EhrPractitionerRole__c','HealthCloudGA__EhrProcedure__c','HealthCloudGA__EhrProcedurePerformer__c','HealthCloudGA__EhrProcedureRequest__c','HealthCloudGA__EhrProgram__c','HealthCloudGA__EhrRelatedObservation__c','HealthCloudGA__EhrRelatedPerson__c','HealthCloudGA__EhrVaccinationProtocol__c','HealthCloudGA__EhrVirtualDevice__c','HealthCloudGA__EhrVirtualDeviceChannel__c']
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
  standardNamespaces,
  alexConfig
};





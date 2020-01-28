/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/*
 Note about Thresholds:
 -recNeg fires if Count is less than or Equal to the threshold
 -recPos fires if Count is greater than threshold
 -if threshold is -1 recNeg fires if count is zero OR undefined
 -if threshold is 0 recNeg fires if count is zero, but not if it is undefined
 e.g
   If Flows are not found, then no subchecks are done on flow types (screen flow, autolaunched flow, flow template, etc) so FlowTemplate count will be undefined
   But, if Flows are found and there are no Flow templates, then FlowTemplate count will be 0
*/
const minAPI = 43;

const rulesVersion = '20200127';



const enablementRules = [{
    name: 'Flows',
    label: 'Take Advantage of Flows',
    condition: {
      metadataType: 'Flow',
      operator: 'notexists',
    },
    resultTrue: {
      message: 'Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.',
      url: 'https://partners.salesforce.com/0693A000007S2Dq'
    },
  },
  {
    name: 'Flow Templates',
    label: 'Include your Flows as Templates',
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
      message: 'When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a'
    },
  },
  {
    name: 'Batch Apex',
    label: 'Follow best practices for Batch Apex',
    condition: {
      metadataType: 'ApexClass.BatchApex',
      operator: 'exists'
    },
    resultTrue: {
      message: 'For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar.',
      url: 'https://partners.salesforce.com/0693A000006aF9G',
    },
  },
  {
    name: 'In App Prompts',
    label: 'Take Advantage of In-App Prompts',
    condition: {
      metadataType: 'Prompt',
      operator: 'notexists'
    },
    resultTrue: {
      message: 'For more information about how to use In-App Prompts to keep your users informed, see this blog.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016'
    },
  },
  {
    name: 'Platform Cache',
    label: 'Take Advantage of Platform Cache',
    condition: {
      metadataType: 'PlatformCachePartition',
      operator: 'notexists'
    },
    resultTrue: {
      message: 'Use Platform Cache to improve the performance of your application.',
      url: 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_cache_namespace_overview.htm'
    }
  },
  {
    name: 'Custom Fields on Activity',
    label: 'Be aware of limits on Custom Fields on Activity',
    condition: {
      metadataType: 'CustomField.objects.Activity',
      operator: 'gte',
      compare: 1
    },
    resultTrue: {
      message: 'Please be aware that there is a hard limit of 100 fields on the Activity object including all managed and unmanaged fields. Your package will not install if this raises the number of fields on the Activity object past this threshold in your subscriber\'s org.'
    }
  },
  {
    name: 'Platform Events',
    label: 'Be aware of Platform Events Best Practices',
    condition: {
      metadataType: 'PlatformEventChannel',
      operator: 'exists'
    },
    resultTrue: {
      message: 'For more information on Platform Events and how to use them within your application, see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000GF5BPQA1'
    }
  },
  {
    name: 'Change Data Capture',
    label: 'Be aware of Change Data Capture Best Practices',
    condition: {
      metadataType: 'PlatformEventChannelMember',
      operator: 'exists'
    },
    resultTrue: {
      message: 'For more information on Change Data Capture and how to use it in your application, please see this webinar.',
      url: 'https://developer.salesforce.com/events/webinars/change-data-capture'
    }
  },
  {
    name: 'Aura Components',
    label: 'Learn about migrating from Aura Web Components to Lightning Web Components',
    condition: {
      metadataType: 'AuraDefinitionBundle',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'LightningComponentBundle',
        operator: 'notexists'
      },
    },
    resultTrue: {
      message: 'Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248'
    }
  },
  {
    name: 'Lightning Web Components',
    label: 'Take advantage of Lightning Web Components',
    condition: {
      metadataType: 'LightningComponentBundle',
      operator: 'notexists'
    },
    resultTrue: {
      message: 'Find more information about how to leverage the power of LWC and for best practices, see this webinar.',
      url: 'https://partners.salesforce.com/0693A000007Kd7oQAC'
    }
  },
  {
    name: 'Einstein Analytics Templates',
    label: 'Learn about Einstein Analytics Template Bundles',
    condition: {
      metadataType: 'WaveTemplateBundle',
      operator: 'exists'
    },
    resultTrue: {
      message: 'For more information on Creating & Distributing Analytics Apps using Templates see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000FYOQOQA5'
    }
  }
];

const mdTypes = [{
    name: 'Permission Sets',
    metadataType: 'PermissionSet'
  },
  {
    name: 'Custom Profiles',
    metadataType: 'Profile'
  },
  {
    name: 'Custom Metadata',
    metadataType: 'CustomMetadata'
  },
  {
    name: 'Feature Parameters (Boolean)',
    metadataType: 'FeatureParameterBoolean'
  },
  {
    name: 'Feature Parameters (Date)',
    metadataType: 'FeatureParameterDate'
  },
  {
    name: 'Feature Parameters (Integer)',
    metadataType: 'FeatureParameterInteger'
  },
  {
    name: 'Custom Settings',
    metadataType: 'CustomSetting__c'
  },
  {
    name: 'Custom Labels',
    metadataType: 'CustomLabel'
  },
  {
    name: 'Tabs',
    metadataType: 'CustomTab'
  },
  {
    name: 'Flows',
    metadataType: 'Flow'
  },
  {
    name: 'Apex Classes',
    metadataType: 'ApexClass'
  },
  {
    name: 'Apex Triggers',
    metadataType: 'ApexTrigger'
  },
  {
    name: 'Custom Reports',
    metadataType: 'Report'
  },
  {
    name: 'Custom Report Types',
    metadataType: 'ReportType'
  },
  {
    name: 'Custom Apps',
    metadataType: 'CustomApplication'
  },
  {
    name: 'Connected Apps',
    metadataType: 'ConnectedApp'
  },
  {
    name: 'In-App Prompts',
    metadataType: 'Prompt'
  },
  {
    name: 'Static Resources',
    metadataType: 'StaticResource'
  },
  {
    name: 'Sharing Rules',
    metadataType: 'SharingRules'
  },
  {
    name: 'Validation Rules',
    metadataType: 'ValidationRule'
  },
  {
    name: 'Custom Objects',
    metadataType: 'CustomObject'
  },
  {
    name: 'Custom Fields',
    metadataType: 'CustomField'
  },
  {
    name: 'Platform Events',
    metadataType: 'PlatformEventChannel'
  },
  {
    name: 'Territory Management',
    metadataType: 'Territory'
  },
  {
    name: 'Territory Management 2.0',
    metadataType: 'Territory2'
  },
  {
    name: 'Visualforce Pages',
    metadataType: 'ApexPage'
  },
  {
    name: 'Aura Web Components',
    metadataType: 'AuraDefinitionBundle'
  },
  {
    name: 'Lightning Web Components',
    metadataType: 'LightningComponentBundle'
  },
  {
    name: 'Einstein Analytics Applications',
    metadataType: 'WaveApplication'
  },
  {
    name: 'Einstein Analytics Dashboards',
    metadataType: 'WaveDashboard'
  },
  {
    name: 'Einstein Analytics Dataflows',
    metadataType: 'WaveDataflow'
  },
  {
    name: 'Einstein Analytics Datasets',
    metadataType: 'WaveDataset'
  },
  {
    name: 'Einstein Analytics Lenses',
    metadataType: 'WaveLens'
  },
  {
    name: 'Einstein Analytics Template Bundles',
    metadataType: 'WaveTemplateBundle'
  },
  {
    name: 'Einstein Analytics Dashboards',
    metadataType: 'WaveDashboard'
  },
  {
    name: 'Person Accounts Enabled?',
    metadataType: 'PersonAccount__c'
  },
  {
    name: 'Record Types',
    metadataType: 'RecordType'
  }
];

const enablementRulesOld = [{
    metadataType: 'Flow',
    label: 'Take Advantage of Flows',
    threshold: -1,
    recNeg: {
      message: 'Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.',
      url: 'https://partners.salesforce.com/0693A000007S2Dq'
    }
  },
  {
    metadataType: 'Flow.FlowTemplate',
    label: 'Include your Flows as Templates',
    threshold: 0,
    recNeg: {
      message: 'When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a'
    }
  },

  {
    metadataType: 'ApexClass.BatchApex',
    label: 'Follow best practices for Batch Apex',
    threshold: 0,
    recPos: {
      message: 'For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar.',
      url: 'https://partners.salesforce.com/0693A000006aF9G'
    }
  },
  {
    metadataType: 'Prompt',
    label: 'Take Advantage of In-App Prompts',
    threshold: -1,
    recNeg: {
      message: 'For more information about how to use In-App Prompts to keep your users informed, see this blog.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016'
    }
  },
  {
    metadataType: 'PlatformCachePartition',
    label: 'Take Advantage of Platform Cache',
    threshold: -1,
    recNeg: {
      message: 'Use Platform Cache to improve the performance of your application.',
      url: 'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_cache_namespace_overview.htm'
    }
  },
  {
    metadataType: 'CustomField.objects.Activity',
    label: 'Be aware of limits on Custom Fields on Activity',
    threshold: 0,
    recPos: {
      message: 'Please be aware that there is a hard limit of 100 fields on the Activity object including all managed and unmanaged fields. Your package will not install if this raises the number of fields on the Activity object past this threshold in your subscriber\'s org.'
    }
  },
  {
    metadataType: 'PlatformEventChannel',
    label: 'Be aware of Platform Events Best Practices',
    threshold: 0,
    recPos: {
      message: 'For more information on Platform Events and how to use them within your application, see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000GF5BPQA1'
    }
  },
  {
    metadataType: 'PlatformEventChannelMember',
    label: 'Be aware of Change Data Capture Best Practices',
    threshold: 0,
    recPos: {
      message: 'For more information on Change Data Capture and how to use it in your application, please see this webinar.',
      url: 'https://developer.salesforce.com/events/webinars/change-data-capture'
    }
  },
  {
    metadataType: 'AuraDefinitionBundle',
    label: 'Learn about migrating from Aura Web Components to Lightning Web Components',
    threshold: 0,
    recPos: {
      message: 'Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog.',
      url: 'https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248'
    }
  },
  {
    metadataType: 'LightningComponentBundle',
    label: 'Take advantage of Lightning Web Components',
    threshold: 0,
    recNeg: {
      message: 'Find more information about how to leverage the power of LWC and for best practices, see this webinar.',
      url: 'https://partners.salesforce.com/0693A000007Kd7oQAC'
    }
  },
  {
    metadataType: 'WaveTemplateBundle',
    label: 'Learn about Einstein Analytics Template Bundles',
    threshold: 0,
    recPos: {
      message: 'For more information on Creating & Distributing Analytics Apps using Templates see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000FYOQOQA5'
    }
  },
  {
    metadataType: 'Report',
    label: 'Learn about Einstein Analytics Template Bundles',
    threshold: 0,
    recPos: {
      message: 'For more information on Creating & Distributing Analytics Apps using Templates see this webinar.',
      url: 'https://partners.salesforce.com/partnerEvent?id=a033A00000FYOQOQA5'
    }
  },

];

const qualityRules = [{
    name: 'Metadata API Version',
    label: 'Using old Metadata API Version',
    condition: {
      metadataType: 'apiVersions.mdapi',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'apiVersions.mdapi',
        operator: 'lt',
        compare: minAPI
      }
    },
    resultTrue: {
      message: `You appear to be using a version of Metadata API less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
    },
  },
  {
    name: 'Apex API Version',
    label: 'Using old Apex API Version',
    condition: {
      metadataType: 'apiVersions.ApexClass',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'apiVersions.ApexClass.*',
        operator: 'lt',
        compare: minAPI
      }
    },
    resultTrue: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Trigger API Version',
    label: 'Using old Trigger API Version',
    condition: {
      metadataType: 'apiVersions.ApexTrigger',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'apiVersions.ApexTrigger.*',
        operator: 'lt',
        compare: minAPI
      }
    },
    resultTrue: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Aura Component API Version',
    label: 'Using old Aura Component API Version',
    condition: {
      metadataType: 'apiVersions.AuraDefinitionBundle',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'apiVersions.AuraDefinitionBundle.*',
        operator: 'lt',
        compare: minAPI
      }
    },
    resultTrue: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'LWC API Version',
    label: 'Using old Lightning Web Component API Version',
    condition: {
      metadataType: 'apiVersions.LightningComponentBundle',
      operator: 'exists',
      conditionAnd: {
        metadataType: 'apiVersions.LightningComponentBundle.*',
        operator: 'lt',
        compare: minAPI
      }
    },
    resultTrue: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },
  {
    name: 'Custom Object Description',
    label: 'Custom Objects should have a description',
    condition: {
      metadataType: 'componentProperties.CustomObject.*.descriptionExists',
      operator: 'notexists'
    },
    resultTrue: {
      message: `It is a best practice that Custom Objects have a description.`,
      showDetails: true
    }
  },
  {
    name: 'Custom Field Description',
    label: 'Custom Fields should have a description',
    condition: {
      metadataType: 'componentProperties.CustomField.*.descriptionExists',
      operator: 'exists'
    },
    resultFalse: {
      message: `It is a best practice that Custom Fields have a description.`,
      showDetails: true
    }
  },
  {
    name: 'Triggers per Object',
    label: 'Multiple Triggers per Object',
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gt',
      compare: 1
    },
    resultTrue: {
      message: 'It is a best practice to have 1 trigger per object. Please check triggers on the objects below to see if you can use triggers and trigger handlers to reduce the number of triggers per object.',
      showDetails: true
    }
  },
  {
    name: 'Process Builders per Object',
    label: 'Multiple Process Builders per Object',
    condition: {
      metadataType: 'Flow.objects.*',
      operator: 'gt',
      compare: 1
    },
    resultTrue: {
      message: 'It is a best best practice to have 1 record-change process per object. Please check Process Builders on the objects below to see if you can combine all processes into one.',
      showDetails: true
    }
  },
  {
    name: 'Change Processes per Object',
    label: 'Multiple Change Processes per Object',
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gte',
      compare: 1,
      conditionAnd: {
        metadataType: 'Flow.objects.*',
        operator: 'gte',
        compare: 1,
        conditionPerItem: true
      },
    },

    resultTrue: {
      message: 'It is a best best practice to have 1 record-change process per object. Avoid using both Triggers and Process Builders on the same object.',
      showDetails: true
    }
  },
];

const qualityRulesOld = [{
    metadataType: 'apiVersions.mdapi',
    label: 'Using old Metadata API Version',
    threshold: minAPI,
    recNeg: {
      message: `You appear to be using a version of Metadata API less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`
    }
  },
  {
    metadataType: 'apiVersions.ApexClass.*',
    label: 'Using old Apex API Version',
    threshold: minAPI,
    recNeg: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`
    }
  },
  {
    metadataType: 'apiVersions.ApexTrigger.*',
    label: 'Using old Trigger API Version',
    threshold: minAPI,
    recNeg: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`
    }
  },
  {
    metadataType: 'apiVersions.AuraDefinitionBundle.*',
    label: 'Using old Aura Component API Version',
    threshold: minAPI,
    recNeg: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`
    }
  },
  {
    metadataType: 'apiVersions.LightningComponentBundle.*',
    label: 'Using old Lightning Web Component API Version',
    threshold: minAPI,
    recNeg: {
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`
    }
  },
  {
    metadataType: 'componentProperties.CustomObject.*.descriptionExists',
    label: 'Custom Objects should have a description',
    threshold: 0,
    recNeg: {
      message: `It is a best practice that Custom Objects have a description.`
    }
  },
  {
    metadataType: 'componentProperties.CustomField.*.descriptionExists',
    label: 'Custom Fields should have a description',
    threshold: 0,
    recNeg: {
      message: `It is a best practice that Custom Fields have a description.`
    }
  },
  {
    metadataType: 'ApexTrigger.objects.*',
    label: 'Multiple Triggers per Object',
    threshold: 1,
    recPos: {
      message: 'It is a best practice to have 1 trigger per object. Please check triggers on the objects below to see if you can use triggers and trigger handlers to reduce the number of triggers per object.'
    }
  },
  {
    metadataType: 'Flow.objects.*',
    label: 'Multiple Process Builders per Object',
    threshold: 1,
    recPos: {
      message: 'It is a best best practice to have 1 record-change process per object. Please check Process Builders on the objects below to see if you can combine all processes into one.'
    }
  },
];
const alertRulesNew = [{
    name: 'Alerts Signup',
    label: 'Stay on Top of Alerts',
    condition: {
      metadataType: 'any',
      operator: 'always'
    },
    resultTrue: {
      message: 'Sign up here to be notified of all Partner Alerts',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000FtFWqQAN'
    }
  },
  {
    name: '@AuraEnabled Methods',
    label: '@AuraEnabled Methods',
    condition: {
      metadataType: 'ApexClass.AuraEnabledCalls',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      message: 'New Permissions Required to Access Apex Classes containing @AuraEnabled methods.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB',  
      showDetails: true
    }    
  },
  {
    name: 'Aura UI Namespace',
    label: 'Aura Components in UI Namespace Retiring in Summer \'21',
    condition: {
      metadataType: 'componentProperties.AuraDefinitionBundle.*.namespaceReferences.ui',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      message: 'In Summer \'21, Lightning Base Components in the ui namespace will be retired.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GXNKsQAP',
      showDetails: true
    }
  },
  {
    name: 'Custom Metadata Permissions',
    label: 'Custom Metadata',
    condition: {
      metadataType: 'CustomMetadata',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      message: 'New Permissions Required for Direct Read Access to Custom Metadata Types.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GimUSQAZ',
    }
  },
  {
    name: 'Custom Settings Direct Read',
    label: 'Custom Settings',
    condition: {
      metadataType: 'CustomSetting__c',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      message: 'New Permissions Required for Direct Read Access to Custom Settings.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GimQ6QAJ',
    }
  },
  {
    name: 'Territory 1 EOL',
    label: 'Territory Management 1.0',
    condition: {
      metadataType: 'Territory',
      operator: 'exists',
      expiration: '2020-10-01T00:00:00.000Z'
    },
    resultTrue: {
      message: 'Territory Management will be End of Life starting in Winter \'20. Please migrate to Territory Management 2.0.',
      url: 'https://help.salesforce.com/articleView?id=000318370&type=1&mode=1',
    }
 },
 {
    name: 'RecordType Access',
    label: 'Change to Record Type Access',
    condition: {
      metadataType: 'RecordType',
      operator: 'exists',
      expiration: '2020-22-01T00:00:00.000Z'
    },
    resultTrue: {
      message: 'There have been changes to Record Type access in permission sets within Managed Packages for Winter \'20 in response to a Known Issue. Subscribers may need to upgrade your package to see this fix.',
      url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GSdBoQAL',
    }
 },
];
const alertRules = [{
    metadataType: 'ApexClass.AuraEnabledCalls',
    label: '@AuraEnabled Methods',
    message: 'New Permissions Required to Access Apex Classes containing @AuraEnabled methods.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB',
    expiration: '2020-10-01T00:00:00.000Z'
  },
  {
    metadataType: 'componentProperties.AuraDefinitionBundle.*.namespaceReferences.ui',
    label: 'Aura Components in UI Namespace Retiring in Summer \'21',
    message: 'In Summer \'21, Lightning Base Components in the ui namespace will be retired.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GXNKsQAP',
    expiration: '2020-10-01T00:00:00.000Z'
  },
  {
    metadataType: 'CustomMetadata',
    label: 'Custom Metadata',
    message: 'New Permissions Required for Direct Read Access to Custom Metadata Types.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GimUSQAZ',
    expiration: '2020-10-01T00:00:00.000Z'
  },
  {
    metadataType: 'CustomSetting__c',
    label: 'Custom Settings',
    message: 'New Permissions Required for Direct Read Access to Custom Settings.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GimQ6QAJ',
    expiration: '2020-10-01T00:00:00.000Z'
  },
  {
    metadataType: 'Territory',
    label: 'Territory Management 1.0',
    message: 'Territory Management will be End of Life starting in Winter \'20. Please migrate to Territory Management 2.0.',
    url: 'https://help.salesforce.com/articleView?id=000318370&type=1&mode=1',
    expiration: '2020-10-01T00:00:00.000Z'
  },

  {
    metadataType: 'RecordType',
    label: 'Change to Record Type Access',
    message: 'There have been changes to Record Type access in permission sets within Managed Packages for Winter \'20 in response to a Known Issue. Subscribers may need to upgrade your package to see this fix.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000GSdBoQAL',
    expiration: '2020-22-01T00:00:00.000Z'
  }
];


const editionWarningRules = [{
    name: 'Essentials',
    blockingItems: [{
        metadataType: 'RecordType',
        label: 'Record Types',
        threshold: 0
      },
      {
        metadataType: 'PersonAccount__c',
        label: 'Person Accounts',
        threshold: 0
      },
      {
        metadataType: 'ApexClass.InvocableApex',
        label: 'Classes with Invocable Apex',
        threshold: 0
      },
      {
        metadataType: 'PlatformEventChannel',
        label: 'Platform Events',
        threshold: 0
      },
      {
        metadataType: 'Profile',
        label: 'Custom Profiles',
        threshold: 0
      },
      {
        metadataType: 'SharingRules',
        label: 'Sharing Rules',
        threshold: 0
      },

    ]
  },
  {
    name: 'Group Edition',
    blockingItems: [{
        metadataType: 'RecordType',
        label: 'Record Types',
        threshold: 0
      },
      {
        metadataType: 'PersonAccount__c',
        label: 'Person Accounts',
        threshold: 0
      },
      {
        metadataType: 'ReportType',
        label: 'Report Types',
        threshold: 0
      },
      {
        metadataType: 'ApexClass.ApexSoap',
        label: 'Classes with SOAP Apex Web Services',
        threshold: 0
      },
      {
        metadataType: 'Profile',
        label: 'Custom Profiles',
        threshold: 0
      },
      {
        metadataType: 'SharingRules',
        label: 'Sharing Rules',
        threshold: 0
      },

    ]
  },
  {
    name: 'Professional Edition',
    blockingItems: [{
        metadataType: 'ApexClass.ApexSoap',
        label: 'Classes with SOAP Apex Web Services',
        threshold: 0
      },
      {
        metadataType: 'ReportType',
        label: 'Report Types',
        threshold: 50
      },

    ]
  },
  {
    name: 'Enterprise Edition',
    blockingItems: [{
      metadataType: 'ReportType',
      label: 'Custom Report Types',
      threshold: 100
    }, ]
  },

];

const techAdoptionRules = [

  {
    metadataType: 'CustomObject',
    label: 'Custom Objects as Primary Data Store',
    threshold: 0,
    recPos: {
      score: 10
    }
  },
  {
    metadataType: 'CustomObject',
    label: 'Custom Objects to Store and Process Data',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'CustomObject.BigObject',
    label: 'Big Objects to Store and Process Data',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'PlatformEventChannelMember',
    label: 'Change Data Capture for Processing Data',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'LightningComponentBundle',
    label: 'Lightning Web Components for User Experience',
    threshold: 0,
    recPos: {
      score: 10
    }
  },
  {
    metadataType: 'AuraDefinitionBundle',
    label: 'Aura Lightning Components for User Experience',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'ApexPage',
    label: 'Visualforce Pages for User Experience',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'Flow.Workflow',
    label: 'Process Builder for Application Processing',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'Flow.Flow',
    label: 'Flows for Data Processing',
    threshold: 0,
    recPos: {
      score: 10
    }
  },
  {
    metadataType: 'ApexClass',
    label: 'Apex for Data Processing',
    threshold: 0,
    recPos: {
      score: 5
    }
  },
  {
    metadataType: 'PlatformCachePartition',
    label: 'Platform Cache for Processing Performance',
    threshold: 0,
    recPos: {
      score: 10
    }
  },
];

export {
  mdTypes,
  enablementRules,
  editionWarningRules,
  alertRules,
  qualityRules,
  minAPI,
  techAdoptionRules,
  rulesVersion,
  alertRulesNew,
};

/*
http://salesforce.vidyard.com/watch/pXTQPKtMkF8vmZDJoBidx9?
Feature Management!!!
*/

/*{
    metadataType: 'ApexTrigger.AsyncTrigger',
    label: 'Take Advantage of Async Triggers',
    threshold: 0,
    recPos: {
      message: 'For more information on Async Triggers and how to use them to enable asychronous trigger proccessing, see this blog',
      url: 'https://developer.salesforce.com/blogs/2019/06/get-buildspiration-with-asynchronous-apex-triggers-in-summer-19.html'
    }
  },*/

/*
      {
      metadataType: 'CustomMetadata',
      label: 'Custom Metadata',
      requiresSR: true
    },
    {
      metadataType: 'ApexClass',
      label: 'Apex',
      threshold: 0,
      requiresSR: true
    },
    {
      metadataType: 'ApexClass.SchedulableApex',
      label: 'Scheduled Apex',
      threshold: 0,
      requiresSR: true
    },
    {
      metadataType: 'CustomObject',
      label: 'Custom Objects',
      threshold: 0,
      requiresSR: true
    },*/

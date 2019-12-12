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

const rulesVersion = '20191023';

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

const enablementRules = [{
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

];

const qualityRules = [{
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

const alertRules = [{
    metadataType: 'ApexClass.AuraEnabledCalls',
    label: '@AuraEnabled Methods',
    message: 'New Permissions Required to Access Apex Classes containing @AuraEnabled methods.',
    url: 'https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB',
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
    blockingItems: [
      {
        metadataType: 'ReportType',
        label: 'Custom Report Types',
        threshold: 100
      },
    ]
  },

];


export {
  mdTypes,
  enablementRules,
  editionWarningRules,
  alertRules,
  qualityRules,
  minAPI,
  rulesVersion
};

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

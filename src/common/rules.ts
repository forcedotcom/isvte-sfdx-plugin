/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const rules = [
  {name: 'Permission Sets', metadataType: 'PermissionSet'},
  {name: 'Custom Metadata', metadataType: 'CustomMetadata'},
  {name: 'Feature Parameters (Boolean)', metadataType: 'FeatureParameterBoolean'},
  {name: 'Feature Parameters (Date)', metadataType: 'FeatureParameterDate'},
  {name: 'Feature Parameters (Integer)', metadataType: 'FeatureParameterInteger'},
  {name: 'Custom Settings', metadataType: 'CustomSetting__c'},
  {name: 'Custom Labels', metadataType: 'CustomLabel' },
  {name: 'Tabs', metadataType: 'CustomTab'},
  {name: 'Flows', metadataType: 'Flow', threshold:0, recNeg: 'For more information about Flows - https://partners.salesforce.com/0693A000007S2Dq',  detailThreshold: [{metadataSubType: 'FlowTemplate', name: 'Flows With Template', threshold:0, recNeg: 'For more information about Flow Templates - https://partners.salesforce.com/0693A000007S2Dq'}]},
  {name: 'Classes', metadataType: 'ApexClass', detailThreshold: [{metadataSubType: 'BatchApex', name: 'Batch Apex', threshold:0, recPos: 'For more information on Batch Apex Design patterns - https://partners.salesforce.com/0693A000006aF9G'}]},
  {name: 'Triggers', metadataType: 'ApexTrigger', detailThreshold: [{metadataSubType: '*', name: 'Any Trigger', threshold:1, recPos: 'Best Practices Recommend 1 trigger per object. For more information on Trigger Best Practices, see this webinar - https://developer.salesforce.com/events/webinars/Deep_Dive_Apex_Triggers'}, {metadataSubType: 'AsyncTrigger', name: 'Async Triggers', threshold:-1, recPos: 'For more information on Async Triggers - https://developer.salesforce.com/blogs/2019/06/get-buildspiration-with-asynchronous-apex-triggers-in-summer-19.html' }]},
  {name: 'Reports', metadataType: 'Report'},
  {name: 'Report Types', metadataType: 'ReportType'},
  {name: 'Custom Apps', metadataType: 'CustomApplication'},
  {name: 'Connected Apps', metadataType: 'ConnectedApp'}, 
  {name: 'In-App Prompts', metadataType: 'Prompt', threshold:0, recNeg: 'For more information - https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016'},
  {name: 'Static Resources', metadataType: 'StaticResource'},
  {name: 'Sharing Rules', metadataType: 'SharingRules'},
  {name: 'Validation Rules', metadataType: 'ValidationRule'},
  {name: 'Custom Objects', metadataType: 'CustomObject'}, 
  {name: 'Custom Fields', metadataType: 'CustomField', detailThreshold: [{metadataSubType: 'object.Activity', 'name': 'Fields on Activity', threshold:0, recPos: 'Please be aware that there is a hard limit of 100 fields on Activity including managed and unmanged'}]}, 
  {name: 'Platform Events', metadataType: 'PlatformEventChannel', threshold: 0, recPos: 'For more information of Platform Events, see this webinar - https://partners.salesforce.com/partnerEvent?id=a033A00000GF5BPQA1'},
  {name: 'Change Data Capture', metadataType: 'PlatformEventChannelMember', threshold: 0, recPos: 'For more information on Change Data Capture, please see this webinar - https://developer.salesforce.com/events/webinars/change-data-capture'},
  {name: 'Territory Management', metadataType: 'Territory'},
  {name: 'Territory Management 2.0', metadataType: 'Territory2'},
  {name: 'Visualforce Pages', metadataType: 'ApexPage'},
  {name: 'Aura Web Components', metadataType: 'AuraDefinitionBundle', threshold:0, recPos: 'For a decision matrix on whether you should be considering migrating to LWC - https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248'},
  {name: 'Lightning Web Components', metadataType: 'LightningComponentBundle', threshold:0,  recNeg: 'Find more information about the power of LWC - https://partners.salesforce.com/0693A000007Kd7oQAC'},
  {name: 'Einstein Analytics Applications', metadataType: 'WaveApplication' },
  {name: 'Einstein Analytics Dashboards', metadataType: 'WaveDashboard'},
  {name: 'Einstein Analytics Dataflows', metadataType: 'WaveDataflow'},
  {name: 'Einstein Analytics Datasets', metadataType: 'WaveDataset'},
  {name: 'Einstein Analytics Lenses', metadataType: 'WaveLens'},
  {name: 'Einstein Analytics Template Bundles', metadataType: 'WaveTemplateBundle', threshold: 0, recPos: 'For more information on Creating & Distributing Analytics Apps using Templates  https://partners.salesforce.com/partnerEvent?id=a033A00000FYOQOQA5'},
  {name: 'Einstein Analytics Dashboards', metadataType: 'WaveDashboard'},

  {name: 'Person Account', metadataType: 'PersonAccount__c'},
  {name: 'Record Types', metadataType: 'RecordType'}
];

const alerts = [
  {metadataType:'ApexClass.AuraEnabledCalls', label:'@AuraEnabled Methods', message:'New Permissions Required to Access Apex Classes containing @AuraEnabled methods. Impacts Guest Users',url:'https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB',expiration:'2020-10-01T00:00:00.000Z'},
  {metadataType:'CustomMetadata', label: 'Custom Metadata', message:'New Permissions Required for Direct Read Access to Custom Metadata Types', url:'https://partners.salesforce.com/partnerAlert?id=a033A00000GimUSQAZ',expiration:'2020-10-01T00:00:00.000Z'},
  {metadataType: 'CustomSetting__c', label: 'Custom Settings', message: 'Be aware of the Alert for New Permissions Required for Direct Read Access to Custom Settings', url:'https://partners.salesforce.com/partnerAlert?id=a033A00000GimQ6QAJ',expiration:'2020-10-01T00:00:00.000Z' }
];

  
const editions = [
  {name: 'Essentials', 
  blockingItems: [
    {metadataType:'RecordType', label: 'Record Types', threshold:0},
    {metadataType:'PersonAccount__c',  label: 'Person Accounts', threshold:0},
    {metadataType:'ApexClass.InvocableApex', label: 'Classes with Invocable Apex', threshold:0},
    {metadataType:'PlatformEventChannel', label: 'Platform Events', threshold:0},
    {metadataType:'Profile', label: 'Custom Profiles', threshold:0},
    {metadataType:'SharingRules', label: 'Sharing Rules', threshold:0},
    {metadataType:'CustomField.object.Activity' , label: 'Custom Fields on Activity', threshold:100},
    {metadataType:'CustomMetadata', label: 'Custom Metadata', requiresSR:true },
    {metadataType:'ApexClass', label:'Apex', threshold:0, requiresSR:true},
    {metadataType:'ApexClass.SchedulableApex', label:'Scheduled Apex', threshold:0, requiresSR:true},
    {metadataType:'CustomObject',  label: 'Custom Objects', threshold:0, requiresSR:true},
  ]},
    {name: 'Group Edition', 
    blockingItems: [
      {metadataType:'RecordType', label: 'Record Types', threshold:0},
      {metadataType:'PersonAccount__c',  label: 'Person Accounts', threshold:0},
      {metadataType:'ReportType' , label: 'Report Types', threshold:0},
      {metadataType:'ApexClass.ApexSoap', label: 'Classes with SOAP Apex Web Services', threshold:0},
      {metadataType:'Profile', label: 'Custom Profiles', threshold:0},
      {metadataType:'SharingRules', label: 'Sharing Rules', threshold:0},
      {metadataType:'CustomField.object.Activity' , label: 'Custom Fields on Activity', threshold:100},
    ]},
    {name: 'Professional Edition', 
    blockingItems: [
      {metadataType:'ApexClass.ApexSoap', label: 'Classes with SOAP Apex Web Services', threshold:0},
      {metadataType:'ReportType' , label: 'Report Types', threshold:50},
      {metadataType:'CustomField.object.Activity' , label: 'Custom Fields on Activity', threshold:100},
    ]},
    {name: 'Enterprise Edition',
    blockingItems: [
      {metadataType:'CustomField.object.Activity' , label: 'Custom Fields on Activity', threshold:100},
      {metadataType:'ReportType' , label: 'Report Types', threshold:100},
    ]},
    
];



export {rules, editions, alerts};








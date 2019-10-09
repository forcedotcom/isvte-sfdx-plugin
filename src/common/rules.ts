/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const mdTypes = [
  {name: 'Permission Sets', metadataType: 'PermissionSet'},
  {name: 'Custom Metadata', metadataType: 'CustomMetadata'},
  {name: 'Feature Parameters (Boolean)', metadataType: 'FeatureParameterBoolean'},
  {name: 'Feature Parameters (Date)', metadataType: 'FeatureParameterDate'},
  {name: 'Feature Parameters (Integer)', metadataType: 'FeatureParameterInteger'},
  {name: 'Custom Settings', metadataType: 'CustomSetting__c'},
  {name: 'Custom Labels', metadataType: 'CustomLabel' },
  {name: 'Tabs', metadataType: 'CustomTab'},
  {name: 'Flows', metadataType: 'Flow'},
  {name: 'Classes', metadataType: 'ApexClass'},
  {name: 'Reports', metadataType: 'Report'},
  {name: 'Report Types', metadataType: 'ReportType'},
  {name: 'Custom Apps', metadataType: 'CustomApplication'},
  {name: 'Connected Apps', metadataType: 'ConnectedApp'}, 
  {name: 'In-App Prompts', metadataType: 'Prompt'},
  {name: 'Static Resources', metadataType: 'StaticResource'},
  {name: 'Sharing Rules', metadataType: 'SharingRules'},
  {name: 'Validation Rules', metadataType: 'ValidationRule'},
  {name: 'Custom Objects', metadataType: 'CustomObject'}, 
  {name: 'Custom Fields', metadataType: 'CustomField'}, 
  {name: 'Platform Events', metadataType: 'PlatformEventChannel'},
  {name: 'Territory Management', metadataType: 'Territory'},
  {name: 'Territory Management 2.0', metadataType: 'Territory2'},
  {name: 'Visualforce Pages', metadataType: 'ApexPage'},
  {name: 'Aura Web Components', metadataType: 'AuraDefinitionBundle'},
  {name: 'Lightning Web Components', metadataType: 'LightningComponentBundle'},
  {name: 'Einstein Analytics Applications', metadataType: 'WaveApplication' },
  {name: 'Einstein Analytics Dashboards', metadataType: 'WaveDashboard'},
  {name: 'Einstein Analytics Dataflows', metadataType: 'WaveDataflow'},
  {name: 'Einstein Analytics Datasets', metadataType: 'WaveDataset'},
  {name: 'Einstein Analytics Lenses', metadataType: 'WaveLens'},
  {name: 'Einstein Analytics Template Bundles', metadataType: 'WaveTemplateBundle'},
  {name: 'Einstein Analytics Dashboards', metadataType: 'WaveDashboard'},
  {name: 'Person Accounts Enabled?', metadataType: 'PersonAccount__c'},
  {name: 'Record Types', metadataType: 'RecordType'}
];

const enablementRules = [
  {metadataType: 'Flow', 
    label: 'Flows', threshold:0, 
    recNeg: {message: 'Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information', url: 'https://partners.salesforce.com/0693A000007S2Dq'}},
  {metadataType:'Flow.FlowTemplate', 
    label: 'Flows with Template', 
    threshold:0, 
    recNeg: {message: 'When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post', url: 'https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a'}},
  {metadataType:'Flow.object.*', 
    label: 'Process Builder per Object', 
    threshold:1, 
    recPos: {message: 'Best Practices Recommend  only one record-change process per object. For more information on Process Builder Best Practices, see this document', url:'https://help.salesforce.com/articleView?id=process_considerations_design_bestpractices.htm&type=5'}},
  {metadataType:'ApexClass.BatchApex', 
    label: 'Batch Apex', 
    threshold:0, 
    recPos: {message: 'For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar',url:'https://partners.salesforce.com/0693A000006aF9G'}},
  {metadataType:'ApexTrigger.object.*', 
    label:'Triggers per Object', 
    threshold:1, 
    recPos: {message:'Best Practices Recommend 1 trigger per object. For more information on Trigger Best Practices, see this webinar',url:'https://developer.salesforce.com/events/webinars/Deep_Dive_Apex_Triggers'}},
  {metadataType:'ApexTrigger.AsyncTrigger', 
    label: 'Async Triggers', 
    threshold:0, 
    recNeg: {message: 'For more information on Async Triggers and how to use them to enable asychronous trigger proccessing, see this blog', url:'https://developer.salesforce.com/blogs/2019/06/get-buildspiration-with-asynchronous-apex-triggers-in-summer-19.html' }},
  {metadataType: 'Prompt', 
    label: 'In-App Prompts', 
    threshold:0, 
    recNeg: {message:'For more information about how to use In-App Prompts to keep your users informed, see this blog',url:'https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016'}},
  {metadataType: 'PlatformCachePartition', 
    label: 'Platform Cache', 
    threshold: 0, 
    recNeg: {message:'Consider using Platform Cache to improve the performance of your application.',url:'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_cache_namespace_overview.htm'}},
  {metadataType: 'CustomField.object.Activity', 
    label: 'Custom Fields on Activity', 
    threshold:0, 
    recPos: {message:'Please be aware that there is a hard limit of 100 fields on Activity including managed and unmanged fields'}},
  {metadataType: 'PlatformEventChannel', 
    label: 'Platform Events', 
    threshold: 0, 
    recPos: {message:'For more information on Platform Events and how to use them within your application, see this webinar',url:'https://partners.salesforce.com/partnerEvent?id=a033A00000GF5BPQA1'}},
  {metadataType: 'PlatformEventChannelMember', 
    label: 'Change Data Capture', 
    threshold: 0, 
    recPos: {message:'For more information on Change Data Capture and how to use it in your application, please see this webinar',url:'https://developer.salesforce.com/events/webinars/change-data-capture'}},
  {metadataType: 'AuraDefinitionBundle', 
    label: 'Aura Web Components', 
    threshold:0, 
    recPos: {message:'Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog',url:'https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248'}},
  {metadataType: 'LightningComponentBundle', 
    label: 'Lightning Web Components', 
    threshold:0,
    recNeg: {message:'Find more information about how to leverage the power of LWC in your application, see this webinar', url:'https://partners.salesforce.com/0693A000007Kd7oQAC'}},
  {metadataType: 'WaveTemplateBundle', 
    label: 'Einstein Analytics Template Bundles', 
    threshold: 0, 
    recPos: {message:'For more information on Creating & Distributing Analytics Apps using Templates see this webinar',url:'https://partners.salesforce.com/partnerEvent?id=a033A00000FYOQOQA5'}},
];

const alerts = [
  {metadataType:'ApexClass.AuraEnabledCalls', 
    label:'@AuraEnabled Methods', 
    message:'New Permissions Required to Access Apex Classes containing @AuraEnabled methods. Impacts Guest Users',
    url:'https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB',
    expiration:'2020-10-01T00:00:00.000Z'},
  {metadataType:'CustomMetadata', 
    label: 'Custom Metadata', 
    message:'New Permissions Required for Direct Read Access to Custom Metadata Types', 
    url:'https://partners.salesforce.com/partnerAlert?id=a033A00000GimUSQAZ',
    expiration:'2020-10-01T00:00:00.000Z'},
  {metadataType: 'CustomSetting__c', 
    label: 'Custom Settings', 
    message: 'Be aware of the Alert for New Permissions Required for Direct Read Access to Custom Settings', 
    url:'https://partners.salesforce.com/partnerAlert?id=a033A00000GimQ6QAJ',
    expiration:'2020-10-01T00:00:00.000Z' },
  {metadataType: 'Territory', 
    label: 'Territory Management 1.0', 
    message: 'Territory Management will be End of Life starting in Winter \'20. Please migrate to Territory Management 2.0', 
    url:'https://help.salesforce.com/articleView?id=000318370&type=1&mode=1',
    expiration:'2020-10-01T00:00:00.000Z' }
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



export {mdTypes, enablementRules, editions, alerts};








isvte-sfdx-plugin
==============

isvte-sfdx-plugin is a SalesforceDX plugin which will scan the metadata of your package and provide technical enablement advice as well as warnings related to best practices and installations limitations by Salesforce Org Edition. It will also help identify features which contribute to your Trailblazer score for partner program benefits.

More information on the plugin and how to use it is available in this [introductory blog post](https://medium.com/inside-the-salesforce-ecosystem/build-better-apps-for-your-customers-with-this-new-dx-plug-in-4877fa0fc305)

For support with this plugin or to provide feedback, please log an issue here or connect with us in the [ISV Technical Enablement Plugin
 Chatter group](https://partners.salesforce.com/0F93A0000004mWj) (Salesforce Partner Community login required) 

## Setup
### **Install as a SalesforceDX Plugin**

```  
sfdx plugins:install isvte-sfdx-plugin
```
You will be prompted to confirm that you want to install an unsigned plugin. Choose yes
```  
This plugin is not digitally signed and its authenticity cannot be verified. Continue installation y/n?: y
```

To whitelist this plugin, [add an entry for it in $HOME/.config/sfdx/unsignedPluginWhiteList.json](https://developer.salesforce.com/blogs/2017/10/salesforce-dx-cli-plugin-update.html).

CI Users: As the plugin is not signed, to install it from a Dockerfile or a script:
```
    echo 'y' | sfdx plugins:install isvte-sfdx-plugin
```

### **Install from source**
1. Clone the repository
```  
git clone https://github.com/forcedotcom/isvte-sfdx-plugin.git
```
2. Link the plugin:
```
sfdx plugins:link isvte-sfdx-plugin/
```

### **Commands**
**`sfdx isvte:mdscan`**
Scans the package contained in the specified directory. Based on that metadata, it will display resources to assist you in creating a high quality AppExchange app. It will also highlight any warnings or restrictions related to installing the package in specific Salesforce Editions

```
USAGE
  $ sfdx isvte:mdscan [-d <directory>] [-p <string>] [-y] [-s <array>] [-t] [--minapi <integer>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --sourcefolder=sourcefolder                                                   [default: mdapiout] directory containing package metadata
  -p, --sfdxpackagexml=sfdxpackagexml                                               path to a package.xml file if current folder is a SFDX Project

  -s, --suppress=suppress                                                           comma separated list of items to suppress.
                                                                                    Valid options are: ZeroInventory, Inventory, Enablement, Quality, Alerts, 
                                                                                    Warnings, API

  -t, --techadoption                                                                Show Tech Adoption calculation for Trailblazer scoring

  -y, --showfullinventory                                                           show package inventory only

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command invocation

  --minapi=minapi                                                                   [default: 43] minimum api version to use during quality checks



EXAMPLE
  Scan a package and provide inventory of monitored metadata items and enablement messages:
  	$sfdx isvte:mdscan -d ./mdapi

  Scan a package using a SFDX project and a package.xml file:
  	$sfdx isvte:mdscan -d ./force-app/main/default -p ./config/package.xml

  Scan a package and provide a complete inventory of package metadata:
  	$sfdx isvte:mdscan -d ./mdapi -y

  Do not display alerts and warnings:
  	$sfdx isvte:mdscan -d ./mdapi -s alerts,warnings

  Display this help message:
  	$sfdx isvte:mdscan -h

  For more information, please connect in the ISV Technical Enablement Plugin
    Chatter group on the Salesforce Partner Community https://partners.salesforce.com/0F93A0000004mWj or log an issue in github 
  https://github.com/forcedotcom/isvte-sfdx-plugin

```


**`sfdx isvte:listrules`**
Outputs all of the rules used in the mdscan command
```
USAGE
  $ sfdx isvte:listrules [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

EXAMPLE
  Display the enablement rules and edition warnings which are checked by the isvte plugin:
  	$sfdx isvte:listrules
  Display this help message:
  	$sfdx isvte:listrules -h

```

**Example Output**
```
jhaydraude@jhaydraude-ltm2:~/Development/Projects/ScanningDemo/ScanningTestApp> sfdx isvte:mdscan -d ./mdApex/ -s zeroinventory
=== Inventory of Package:
Metadata Type                          Count
─────────────────────────────────────  ─────
Permission Sets                        1
Custom Profiles                        0
Custom Metadata                        0
Feature Parameters (Boolean)           0
Feature Parameters (Date)              0
Feature Parameters (Integer)           0
Custom Settings                        0
Custom Labels                          0
Tabs                                   2
Flows                                  0
Apex Classes                           12
  With Future Methods                  0
  With Aura Enabled Methods            8
  With Invocable Methods or Variables  0
  Batch Apex                           0
  Apex REST                            0
  SOAP Web Services                    0
  Schedulable Apex                     1
Apex Triggers                          1
  Async Triggers                       0
  Triggers on Measure__c               1
Custom Reports                         0
Custom Report Types                    0
Custom Apps                            1
  Lighting Applications                1
   Lighting Consoles                   0
  Classic Applications                 0
   Classic Consoles                    0
Connected Apps                         0
In-App Prompts                         0
Static Resources                       10
Sharing Rules                          0
Validation Rules                       0
Custom Objects                         4
  Big Objects                          0
  External Objects                     0
Custom Fields                          44
  Total Fields on Standard Objects     0
  Total Fields on Custom Objects       44
   Fields on Measure_Team__c           8
   Fields on Measure__c                27
   Fields on Method__c                 3
   Fields on V2MOM__c                  6
Platform Events                        0
Territory Management                   0
Territory Management 2.0               0
Visualforce Pages                      0
Aura Web Components                    35
Lightning Web Components               0
Einstein Analytics Applications        0
Einstein Analytics Dashboards          0
Einstein Analytics Dataflows           0
Einstein Analytics Datasets            0
Einstein Analytics Lenses              0
Einstein Analytics Template Bundles    0
Einstein Analytics Dashboards          0
Record Types                           0


=== Best Practices and Feature Recommendations:
Visit the ISV Technical Success Center:
For more resources to help build a successful app, visit the ISV Technical Success Center on the Partner Community
URL:http://p.force.com/TECenter

Take Advantage of Flows:
Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.
URL:https://partners.salesforce.com/0693A000007S2Dq

Take Advantage of In-App Prompts:
For more information about how to use In-App Prompts to keep your users informed, see this blog.
URL:https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016

Take Advantage of Platform Cache:
Use Platform Cache to improve the performance of your application.
URL:https://medium.com/inside-the-salesforce-ecosystem/leverage-platform-cache-to-reduce-transaction-time-and-increase-customer-satisfaction-cd3616c9c6ee

Learn about migrating from Aura Web Components to Lightning Web Components:
Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog.
URL:https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248

Take advantage of Lightning Web Components:
Find more information about how to leverage the power of LWC and for best practices, see this webinar.
URL:https://partners.salesforce.com/0693A000007Kd7oQAC

=== Quality Rules:
Using old Apex API Version:
You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.
Components: FLSCheck, MeasureChatterCtrl, MeasureChatterCtrlSharing, V2MOMApex_TestClass, V2MOMQuarterlyReminder, V2MOM_Controller, V2MOM_InItWrapper, V2MOM_LinkReportClass, V2MOM_Measure_Controller, V2MOM_MobileCtrl, V2MOM_TeamViewCtrl, V2MOM_UtilCls

Using old Trigger API Version:
You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.
Components: MeasureTargetChange

Using old Aura Component API Version:
You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.
Components: DeleteMeasureDialogue, DeleteMeasureDialogueFooter, MeasureChatterCmp, ObstaclesAndComments, ToggleSplitByQuarter, V2MOMMobileMOM, V2MOMMobileMeasure, V2MOMMobileMnM, V2MOMMobileV2, V2MOM_AdoptMeasure, V2MOM_AssignMeasure, V2MOM_AssignedMeasure, V2MOM_Home, V2MOM_HomeCard, V2MOM_LinkReportScreen, V2MOM_Main, V2MOM_Measure, V2MOM_Method, V2MOM_MobileHome, V2MOM_MobileMOMComments, V2MOM_MultiSelect, V2MOM_ProgressTracker, V2MOM_ReorderMethods, V2MOM_TeamViewCmp, V2MOM_UserSelect, custom_option, custom_pill

Custom Objects should have a description:
It is a best practice that Custom Objects have a description.
Components: CustomObject, Measure_Team__c, Measure__c, Method__c, V2MOM__c

Custom Fields should have a description:
It is a best practice that Custom Fields have a description.
Components: CustomField, Measure_Team__c.Current_Value__c, Measure_Team__c.MeasureTeamChatFeedId__c, Measure_Team__c.Measure__c, Measure_Team__c.Member__c, Measure_Team__c.Percentage__c, Measure_Team__c.Status__c, Measure_Team__c.Target_Value__c, Measure_Team__c.Type__c, Measure__c.Assigned_Current_Value__c, Measure__c.Comments__c, Measure__c.Completion_By_Date__c, Measure__c.Completion_By_Quarter__c, Measure__c.Current_Value__c, Measure__c.MeasureChatFeedId__c, Measure__c.Measure_Team_Member_Count__c, Measure__c.Method__c, Measure__c.Obstacles__c, Measure__c.Priority__c, Measure__c.Q1_Completion__c, Measure__c.Q1_Target__c, Measure__c.Q1__c, Measure__c.Q2_Completion__c, Measure__c.Q2_Target__c, Measure__c.Q2__c, Measure__c.Q3_Completion__c, Measure__c.Q3_Target__c, Measure__c.Q3__c, Measure__c.Q4_Completion__c, Measure__c.Q4_Target__c, Measure__c.Q4__c, Measure__c.Split_By_Quarter__c, Measure__c.Status__c, Measure__c.Target_Value__c, Measure__c.Total_Current_Value__c, Measure__c.Track_Progress_By__c, Method__c.Description__c, Method__c.Order__c, Method__c.V2MOM__c, V2MOM__c.FY_Year__c, V2MOM__c.Published_Date__c, V2MOM__c.Status__c, V2MOM__c.User__c, V2MOM__c.Values__c, V2MOM__c.Vision__c

=== Partner Alerts:
Stay on Top of Alerts:
Sign up here to be notified of all Partner Alerts
URL:https://partners.salesforce.com/partnerAlert?id=a033A00000FtFWqQAN

@AuraEnabled Methods:
New Permissions Required to Access Apex Classes containing @AuraEnabled methods.
URL:https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB
Components: AuraEnabledCalls

Aura Components in UI Namespace Retiring in Summer '21:
In Summer '21, Lightning Base Components in the ui namespace will be retired.
URL:https://partners.salesforce.com/partnerAlert?id=a033A00000GXNKsQAP
Components: ObstaclesAndComments, V2MOMMobileMnM, V2MOMMobileV2, V2MOM_AssignMeasure, V2MOM_Home, V2MOM_LinkReportScreen, V2MOM_Measure, V2MOM_Method, V2MOM_MobileHome, V2MOM_MobileMOMComments, V2MOM_MultiSelect

All new orgs will sign up with External Sharing Model set to Private for all entities in Spring’20:
The external sharing model is automatically enabled in Salesforce orgs created in Spring ’20 or after. Also, external access levels are initially set to Private for all objects in these orgs. These changes don’t affect existing customers.
URL:https://partners.salesforce.com/partnerAlert?id=a033A00000GNnm3QAD

=== Installation Warnings
Can be installed in any Edition

Feature and License Dependencies:
  Community Cloud

=== Technology Adoption:
Which platform technology does your application use as its primary data store?

   Custom Objects: Found


Which other platform technologies does your application use to process and store data?

   Custom Objects: Found
   Big Objects: Not Found
   Platform Events: Not Found
   Change Data Capture: Not Found


Which user interface technologies does your application use to deliver the end-user experience?

   Lightning Web Components: Not Found
   Aura Lightning Components: Found
   Visualforce Pages: Not Found


Which technologies does your app use for application processing and security?

   Process Builder: Not Found
   Screen Flows: Not Found
   Autolaunched Flows: Not Found
   Apex: Found
   Platform Cache: Not Found

```

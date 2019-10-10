isvte-sfdx-plugin
==============

isvte-sfdx-plugin is a SalesforceDX plugin which will scan the metadata of your package and provide technical enablement advice as well as warnings related to best practices and installations limitations by Salesforce Org Edition.

For support with this plugin or to provide feedback, please log an issue here or connect with us in the [Salesforce Partner Community](https://partners.salesforce.com/_ui/core/chatter/groups/GroupProfilePage?g=0F9300000001s8iCAA)

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
  $ sfdx isvte:mdscan [-d <directory>] [-y] [-s <array>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --sourcefolder=sourcefolder
      [default: mdapiout] directory containing package metadata

  -s, --suppress=suppress
      comma separated list of items to suppress.
      Valid options are: ZeroInventory, Inventory, Enablement, Alerts, Warnings

  -y, --showfullinventory
      show package inventory only

  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

EXAMPLE
  Scan a package and provide inventory of monitored metadata items and enablement messages:
  	$sfdx isvte:mdscan -d ./mdapi

  Scan a package and provide a complete inventory of package metadata:
  	$sfdx isvte:mdscan -d ./mdapi -y

  Do not display alerts and warnings:
  	$sfdx isvte:mdscan -d ./mdapi -s alerts,warnings

  Display this help message:
  	$sfdx isvte:mdscan -h

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
$ sfdx isvte:mdscan -d mdApex/ 
=== Inventory of Package:
METADATA TYPE                          COUNT
─────────────────────────────────────  ─────
Permission Sets                        1
Custom Metadata                        0
Feature Parameters (Boolean)           0
Feature Parameters (Date)              0
Feature Parameters (Integer)           0
Custom Settings                        0
Custom Labels                          0
Tabs                                   5
Flows                                  1
  Screen Flows                         1
  Autolaunched Flows                   0
  Process Builder                      0
  Flow Templates                       0
    Screen Flow Templates              0
    Autolaunched Flow Templates        0
Classes                                6
  With Future Methods                  2
  With Aura Enabled Methods            4
  With Invocable Methods or Variables  0
  Batch Apex                           1
  Apex REST                            0
  SOAP Web Services                    0
  Schedulable Apex                     0
Reports                                9
Report Types                           0
Custom Apps                            4
  Lighting Applications                4
   Lighting Consoles                   1
  Classic Applications                 0
   Classic Consoles                    0
Connected Apps                         0
In-App Prompts                         0
Static Resources                       1
Sharing Rules                          0
Validation Rules                       0
Custom Objects                         4
  Big Objects                          0
  External Objects                     0
Custom Fields                          25
  Total Fields on Standard Objects     2
   Fields on Activity                  1
   Fields on Contact                   1
  Total Fields on Custom Objects       23
   Fields on Activity__c               11
   Fields on Expense_Type__c           5
   Fields on Expense__c                7
Platform Events                        0
Territory Management                   0
Territory Management 2.0               0
Visualforce Pages                      0
Aura Web Components                    9
Lightning Web Components               18
  Exposed Components                   10
  Record Page Components               10
  App Page Components                  10
  Home Page Components                 5
  Flow Screen Components               0
Einstein Analytics Applications        0
Einstein Analytics Dashboards          0
Einstein Analytics Dataflows           0
Einstein Analytics Datasets            0
Einstein Analytics Lenses              0
Einstein Analytics Template Bundles    0
Einstein Analytics Dashboards          0
Person Accounts Enabled?               0
Record Types                           0


=== ISV Technical Enablement:
Include your Flows as Templates:
  When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post
	URL:https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a

Best Practices for Packaging Batch Apex:
  For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar
	URL:https://partners.salesforce.com/0693A000006aF9G

Multiple Triggers per Object - Expense_Type__c:
  Best Practices Recommend 1 trigger per object. For more information on Trigger Best Practices, see this webinar
	URL:https://developer.salesforce.com/events/webinars/Deep_Dive_Apex_Triggers

Take Advantage of Async Triggers:
  For more information on Async Triggers and how to use them to enable asychronous trigger proccessing, see this blog
	URL:https://developer.salesforce.com/blogs/2019/06/get-buildspiration-with-asynchronous-apex-triggers-in-summer-19.html

Take Advantage of In-App Prompts:
  For more information about how to use In-App Prompts to keep your users informed, see this blog
	URL:https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016

Take Advantage of Platform Cache:
  Consider using Platform Cache to improve the performance of your application.
	URL:https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_cache_namespace_overview.htm

Limits on Custom Fields on Activity:
  Please be aware that there is a hard limit of 100 fields on Activity including managed and unmanged fields
	URL:undefined

Aura Web Components vs Lightning Web Components:
  Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog
	URL:https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248



=== Alerts:
@AuraEnabled Methods:
  New Permissions Required to Access Apex Classes containing @AuraEnabled methods. Impacts Guest Users
	URL:https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB


=== Installation Warnings:
Package cannot be installed in Essentials due to:
  Apex count (6) is greater than the edition limit (0)
	This restriction is lifted when your package passes Security Review
  Custom Objects count (4) is greater than the edition limit (0)
	This restriction is lifted when your package passes Security Review

```

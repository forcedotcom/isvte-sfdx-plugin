isvte-sfdx-plugin
==============

isvte-sfdx-plugin is a SalesforceDX plugin which will scan the metadata of your package and provide technical enablement advice as well as warnings related to best practices and installations limitations by Salesforce Org Edition. Note that this currently works with packages in metadata API format, not sfdx native source format.

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
  $ sfdx isvte:mdscan [-d <directory>] [-y] [-s <array>] [--minapi <integer>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --sourcefolder=sourcefolder                                                   [default: mdapiout] directory containing package 
                                                                                    metadata

  -s, --suppress=suppress                                                           comma separated list of items to suppress.
                                                                                    Valid options are: ZeroInventory, Inventory, Enablement, 
                                                                                    Quality, Alerts, Warnings, API

  -y, --showfullinventory                                                           show package inventory only

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command 
                                                                                    invocation

  --minapi=minapi                                                                   [default: 43] minimum api version to use during quality 
                                                                                    checks

EXAMPLE
  Scan a package and provide inventory of monitored metadata items and enablement messages:
  	$sfdx isvte:mdscan -d ./mdapi

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
METADATA TYPE                       COUNT
──────────────────────────────────  ─────
Permission Sets                     1
Tabs                                5
Flows                               1
  Screen Flows                      1
Apex Classes                        6
  With Future Methods               2
  With Aura Enabled Methods         4
  Batch Apex                        1
Custom Reports                      9
Custom Apps                         4
  Lighting Applications             4
   Lighting Consoles                1
Static Resources                    1
Custom Objects                      4
Custom Fields                       25
  Total Fields on Standard Objects  2
   Fields on Activity               1
   Fields on Contact                1
  Total Fields on Custom Objects    23
   Fields on Activity__c            11
   Fields on Expense_Type__c        5
   Fields on Expense__c             7
Aura Web Components                 9
Lightning Web Components            18
  Exposed Components                10
  Record Page Components            10
  App Page Components               10
  Home Page Components              5


=== Best Practices and Feature Recommendations:
Include your Flows as Templates:
When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post.
URL:https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a

Follow best practices for Batch Apex:
For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar.
URL:https://partners.salesforce.com/0693A000006aF9G

Be aware of limits on Custom Fields on Activity:
Please be aware that there is a hard limit of 100 fields on the Activity object including all managed and unmanaged fields. Your package will not install if this raises the number of fields on the Activity object past this threshold in your subscriber's org.

Learn about migrating from Aura Web Components to Lightning Web Components:
Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog.
URL:https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248



=== Quality Rules:
Custom Objects should have a description:
It is a best practice that Custom Objects have a description.
Components: Expense_Type__c, Expense__c

Custom Fields should have a description:
It is a best practice that Custom Fields have a description.
Components: Activity__c.Average_Spend_per_Recipient__c, Activity__c.Country__c, Activity__c.End_Date__c, Activity__c.Number_of_Expenses__c, Activity__c.Number_of_Recipients__c, Activity__c.Number_of_Types__c, Activity__c.Payment_Entity__c, Activity__c.Product_Name__c, Activity__c.Start_Date__c, Activity__c.Status__c, Activity__c.Total_Spend__c, Contact.Recepient_ID__c, Expense_Type__c.Activity__c, Expense_Type__c.Description__c, Expense_Type__c.Spend_per_Recipient__c, Expense_Type__c.Total_Number_of_Expenses__c, Expense_Type__c.Total_Spend__c, Expense__c.Amount__c, Expense__c.Comment__c, Expense__c.Currency__c, Expense__c.Expense_Type__c, Expense__c.Include__c, Expense__c.Payment_Date__c, Expense__c.Recipient_Name__c

Multiple Triggers per Object:
It is a best practice to have 1 trigger per object. Please check triggers on the objects below to see if you can use triggers and trigger handlers to reduce the number of triggers per object.
Components: Expense_Type__c

=== Partner Alerts:
Sign up here to be notified of all Partner Alerts: 
URL:https://partners.salesforce.com/partnerAlert?id=a033A00000FtFWqQAN

@AuraEnabled Methods:
New Permissions Required to Access Apex Classes containing @AuraEnabled methods.
URL:https://partners.salesforce.com/partnerAlert?id=a033A00000Fvo12QAB


=== Installation Warnings:
Can be installed in any Edition
```

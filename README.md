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
  $ sfdx isvte:mdscan [-d <directory>] [-y] [-s <array>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --sourcefolder=sourcefolder                                                   [default: mdapiout] directory containing package metadata

  -s, --suppress=suppress                                                           comma separated list of items to suppress.
                                                                                    Valid options are: ZeroInventory, Inventory, Enablement, CodeQuality, 
                                                                                    Alerts, Warnings

  -y, --showfullinventory                                                           show package inventory only

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command invocation

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
sfdx isvte:mdscan -d ./mdApex/ -s zeroinventory
=== Inventory of Package:
METADATA TYPE                       COUNT
──────────────────────────────────  ─────
Permission Sets                     1
Tabs                                5
Flows                               1
  Screen Flows                      1
Classes                             6
  With Future Methods               2
  With Aura Enabled Methods         4
  Batch Apex                        1
Reports                             9
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


=== ISV Technical Enablement:
Include your Flows as Templates:
  When packaging a Flow, consider using a Flow Template to allow your subscribers to modify the flow to suit their needs. For more information about Flow Templates see this blog post
	URL:https://medium.com/inside-the-salesforce-ecosystem/pre-built-business-processes-how-isvs-use-flow-templates-ddc9910ff93a

Best Practices for Packaging Batch Apex:
  For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar
	URL:https://partners.salesforce.com/0693A000006aF9G

Take Advantage of Async Triggers:
  For more information on Async Triggers and how to use them to enable asychronous trigger proccessing, see this blog
	URL:https://developer.salesforce.com/blogs/2019/06/get-buildspiration-with-asynchronous-apex-triggers-in-summer-19.html

Limits on Custom Fields on Activity:
  Please be aware that there is a hard limit of 100 fields on Activity including managed and unmanged fields

Aura Web Components vs Lightning Web Components:
  Lightning Web Components are the new Salesforce standard for Lightning Components featuring easier devlopment, better performance and standards compliance. For a decision matrix on whether you should be considering migrating to LWC see this blog
	URL:https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248



=== Code Quality Notes:
Using old Metadata API Version:
  You appear to be using a version of Metadata API less than the recommended 45
	Exceptions: mdapi

Using old Apex API Version:
  You appear to be using an API version less than 45 for this component
	Exceptions: ExpenseTypes, Expenses, LightningLookupController, LightningLookupControllerTest, Recepients, UpdateExpenseTypeCount

Using old Trigger API Version:
  You appear to be using an API version less than 45 for this component
	Exceptions: ExpenseType, RollupETExpenses, RollupExpenses, UpdateAverage

Using old Aura Component API Version:
  You appear to be using an API version less than 45 for this component
	Exceptions: CmpPills, LightningLookup, NavigateToSObject, TabWrapper, lookupFSC

Using old Lightning Web Component API Version:
  You appear to be using an API version less than 45 for this component
	Exceptions: activityCard, activityOverview, activityOverviewDetail, activitySearch, expenseCard, expenseDetail, expenseDetailCard, expenseDetailList, expenseSummary, expenseSummaryPH, expenseTypeDetail, overall, pubsub, recepientCard, recepientDetail, recepientSummary, recepientsList, recipientsSummaryPH

Custom Objects should have a description:
  Custom Objects should have a description for useability
	Exceptions: Expense_Type__c, Expense__c

Custom Fields should have a description:
  Custom Fields should have a description for useability
	Exceptions: Activity__c.Average_Spend_per_Recipient__c, Activity__c.Country__c, Activity__c.End_Date__c, Activity__c.Number_of_Expenses__c, Activity__c.Number_of_Recipients__c, Activity__c.Number_of_Types__c, Activity__c.Payment_Entity__c, Activity__c.Product_Name__c, Activity__c.Start_Date__c, Activity__c.Status__c, Activity__c.Total_Spend__c, Contact.Recepient_ID__c, Expense_Type__c.Activity__c, Expense_Type__c.Description__c, Expense_Type__c.Spend_per_Recipient__c, Expense_Type__c.Total_Number_of_Expenses__c, Expense_Type__c.Total_Spend__c, Expense__c.Amount__c, Expense__c.Comment__c, Expense__c.Currency__c, Expense__c.Expense_Type__c, Expense__c.Include__c, Expense__c.Payment_Date__c, Expense__c.Recipient_Name__c

Multiple Triggers per Object:
  Best Practices Recommend 1 trigger per object. Please check triggers on the objects below to see if you can use triggers and trigger handlers to reduce the number of triggers per object.
	Exceptions: Expense_Type__c

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

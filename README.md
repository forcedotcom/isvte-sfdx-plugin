te-scan-plugin
==============

Scan Metadata and Provide Technical enablement feedback


# Usage:
`sfdx isvte:mdscan -d <path to package folder containing package.xml>`

# Sample Output:
```
sfdx isvte:mdscan -d metadata/
Inventory of Package:
METADATA TYPE                       COUNT
──────────────────────────────────  ─────
Permission Sets                     1
Custom Metadata                     0
Feature Management                  0
Custom Settings                     0
Custom Labels                       0
Tabs                                5
Flows                               1
Flows w/Template                    0
Classes                             6
Triggers                            4
Reports                             9
Report Types                        0
Connected Apps                      0
In-App Prompts                      0
Static Resources                    1
Sharing Rules                       0
Validation Rules                    0
Custom Objects                      4
Custom Fields                       25
  Fields on Activity                1
  Fields on Activity__c             11
  Fields on Contact                 1
  Fields on Expense_Type__c         5
  Fields on Expense__c              7
  Total Fields on Standard Objects  2
  Total Fields on Custom Objects    23
Big Objects                         0
External Objects                    0
Change Data Capture                 -1
Platform Events                     0
Visualforce Pages                   0
Aura Web Components                 9
Lightning Web Components            18
Person Account                      0
Record Types                        0

ISV Technical Enablement:
Flows w/Template: For more information about Flows - https://partners.salesforce.com/0693A000007S2Dq
In-App Prompts: For more information - https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016
Fields on Activity: Please be aware that there is a hard limit of 100 fields on Activity including managed and unmanged
Aura Web Components: For a decision matrix on whether you should be considering migrating to LWC - https://medium.com/inside-the-salesforce-ecosystem/lightning-web-components-an-isv-partner-digest-59d9191f3248
Person Account: You do not use Person Accounts

Installation Warnings:
Can be installed in any Edition
```

To install this plugin:
1. Clone the repository
```  
git clone https://github.com/jhaydraude/te-scan-plugin.git
```
2. Link the plugin:
```
sfdx plugins:link te-scan-plugin/
```
3. Execute the appy Technical Enablement plugin against your source
```
cd <project source dir>
sfdx isvte:mdscan -d <metadata directory>
```
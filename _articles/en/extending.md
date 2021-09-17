---
title: Extending the ISVTE Plugin
lang: en
---
## Rules Explained

The ISVTE Plugin reports are controlled by a set of rules which are executed against an inventory of the package. These rules are defined in the file [rules.ts](https://github.com/forcedotcom/isvte-sfdx-plugin/blob/master/src/common/rules.ts). The rules are categorized based on the sections of the report they apply to.

### Inventory Structure

To see the inventory structure that the rules run against, execute the isvte plugin with the --json flag and inspect the result.MetadataInventory object.

```
sfdx isvte:mdscan -d <metadata folder> --json | jq .result.MetadataInventory
```

The output will look similar to:

```
{
  "CustomApplication": {
    "index": "0",
    "count": 1,
    "LightingAppCount": 1,
    "LightningConsoleCount": 0,
    "ClassicAppCount": 0,
    "ClassicConsoleCount": 0
  },
  "ApexClass": {
    "index": "1",
    "count": 2,
    "FutureCalls": 0,
    "AuraEnabledCalls": 1,
    "InvocableCalls": 0,
    "BatchApex": 0,
    "SchedulableApex": 0,
    "ApexRest": 0,
    "ApexSoap": 0
  },
  "FlexiPage": {
    "index": "2",
    "count": 2
  },
  "LightningComponentBundle": {
    "index": "3",
    "count": 5,
    "ExposedComponents": 3,
    "targets": {
      "lightning__AppPage": 3,
      "lightning__HomePage": 1
    }
  },
  "PermissionSet": {
    "index": "4",
    "count": 1
  },
  "CustomTab": {
    "index": "5",
    "count": 1
  },
  "apiVersions": {
    "mdapi": 46,
    "ApexClass": {
      "appAnalyticsRequestController": 45,
      "appAnalyticsRequestControllerTest": 45
    },
    "LightningComponentBundle": {
      "appAnalyticsRequestCard": 45,
      "appAnalyticsRequestList": 45,
      "appAnalyticsRequestPageWrapper": 45,
      "newAnalyticsRequestForm": 45,
      "pubsub": 45
    }
  },
  "componentProperties": {},
  "dependencies": {
    "namespaces": {
      "sfLma": 1
    },
    "components": {
      "sfLMA__Package__c": {
        "type": "Custom",
        "name": "Package",
        "extension": "c",
        "namespace": "sfLMA",
        "fullName": "sfLMA__Package__c"
      },
    }
  }
}

```

### Querying The Inventory

Inventory items are queried using the ```metadataType``` propery within rules. This metadataType is almost exactly a metadataType as defined in the [Metadata API Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_types_list.htm) but also includes other items that come out of the plugin's inventory of the package. 
To reference Lightning Web Components exposed to App Pages from the inventory above you can do:
```
metadataType: 'LightningComponentBundle.targets.lightning__AppPage'
```

You can also use * as a wildcard, so to identify the api versions of all ApexClasses, you can do:
```
metadataType: 'apiVersions.ApexClass.*'
```
 
### Rule Conditions
Most rules have a condition which causes them to fire. This condition is defined as:

```
interface ICondition {
  metadataType: string, //The Metadata Type to query
  operator: operatorTypes, // The operator of the condition
  operand?: number | [number | 'minAPI',number | 'minAPI'], //value that operator works on
  expiration?: string, //Expiration date of the condition
  processAlways?: Boolean,  //(only within a conditionOr OR a conditionAnd)
  conditionPerItem?: Boolean, // (only within a conditionAnd)
  conditionOr?: ICondition, //Extra condition to be ORed with this condition
  conditionAnd?: ICondition //Extra condition to be ANDed with this condition
  showDetails?: Boolean //Toggle whether individual items that meet the condition are displayed
}
```

```metadataType``` is defined as above.

```operator``` can be one of: 'always', 'never', 'exists', 'notexists', 'null', 'gt', 'gte', 'lt', 'lte', 'eq', 'between'

```operand``` is the numerical value (or the placeholder minAPI) that the operator works against.

So a condition like:
```
{
  metadataType: 'dependencies.namespaces.sfLMA',
  operator: 'gte',
  operand: 1
}
```
would return true in the sample inventory because there is a dependency identified on the sfLma Namespace 

```
"dependencies": {
    "namespaces": {
      "sfLma": 1
    }
}
```


```conditionAnd``` and ```conditionOr``` are extra conditions that can be used to increase the complexity of a query. 

For example:

```
{
  metadataType: 'Flow.FlowTemplate',
  operator: 'notexists',
  conditionAnd: {
    processAlways: false,
    metadataType: 'Flow',
    operator: 'exists'
  }
},
```
would return true if there are no Flow Templates and there are Flows.

A condition can have a ```conditionAnd``` or a ```conditionOr``` or neither, but not both. You can however, chain as many conditions as you need using ```conditionAnd``` and ```conditionOr```.

```
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
```



### Rule Results

Several Rule Types have a "Result" component which describes what is presented based on the outcome of the condition.

A Result is defined as:
```
interface IResult {
  label: string, //Friendly output to display when rule is triggered 
  message: string, //Text block to display
  url?: string, //link to content
  showDetails?: Boolean //Toggle whether the individual items that trigger the rule are displayed
}
```

## Inventory Report Rules

Metadata components listed in the Inventory report are defined in the ```mdTypes``` list within the rules file. Note that this list defines only what is displayed in the report; it has no impact on what is actually inventoried.

Inventoried items conform to the following interface:
```
interface IMetadataType {
  label: string,
  metadataType: string;
}
```
```label``` is the text to be displayed.

```metadataType``` is the item to be counted. 

Sample Rules:

```
{
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
}
```

Output:
```
=== Inventory of Package:
Metadata Type                           Count
──────────────────────────────────────  ─────
Permission Sets                         4
Custom Profiles                         0
Custom Metadata                         0
```




## Enablement, Quality, and Partner Alert Rules
Enablement content listed under the **Best Practices and Feature Recommendations** heading is defined in the ```enablementRules``` list.

Code Quality content listed under the **Quality Rules** heading is defined in the ```qualityRules``` list.

Partner Alerts listed under the **Partner Alerts** heading are defined in the ```alertRules``` list.

These rules all follow the general structure:
```
interface IRule {
  name: string, // The Rule Name
  condition: ICondition, // Logic to determine whether the rule is triggered
  resultTrue?: IResult, //Output if the condition is met 
  resultFalse?: IResult //Output if the condition is not met
}
```

Sample Rule:
```
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
```

Output:
```
=== Best Practices and Feature Recommendations:

Take Advantage of Flows:
Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.
URL:https://partners.salesforce.com/0693A000007S2Dq
```

## Edition Installation Rules
The rules that define which editions your package can be installed into are defined in the ```editionWarningRules``` list. They are defined as:
```
interface IInstallRule {
  name: string, //Salesforce Edition
  blockingItems: {label: String, condition: ICondition}[] //Conditions which, if true, mean the package cannot be installed in this edition
}
```

Sample Rules:
```
{
  name: 'Essentials',
  blockingItems: [{
      label: 'Record Types',
      condition: {
        metadataType: 'RecordType',
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
  ]
}
```

Output
```
=== Installation Warnings
Package cannot be installed in Essentials due to:
  Record Types 
  Custom Profiles 
```

## Dependency Rules
Dependency Rules identify a dependency on a feature, cloud, or other item. They are defined in the ```dependencyRules``` list and follow the structure:
```
interface IDependecyRule {
  name: string, //Name for the dependency rule
  label: string, //Friendly output of the dependency rule
  condition: ICondition //Condition which fires the dependency rule
}
```

Sample Rule:
```
{
  name: 'TCRM',
  label: 'TableauCRM',
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
```

Output:
```
=== Dependencies:
TableauCRM 
```

## Data Models
Data models can be used to dynamically create a dependency rule. They are defined in the object ```dataModels``` and follow the structure:
```
interface IDataModel {
  name: string, //Name of the cloud or feature this data model describes
  label: string,  //Friendly output of the cloud or feature name
  fields?: string[], //Array of fields (in Object.Field format) included in this datamodel
  objects?: string[], //Array of objects included in this data model
  namespaces?: string[], //Array of namespaces included in this data model
}
```

This rule type will fire if any references are found to the namespaces within the ```namespaces``` property or if any references are found to objects listed in the ```objects``` property.

For example, Work.com uses the wkcc namespace for the Command Center managed package and enabling Work.com in an org creates the objects: Employee,EmployeeCrisisAssessment, InternalOrganizationUnit, and Crisis. If a package refers to these items, then there is a dependecy on Work.com.

```
{
  name: 'work.com',
  label: 'Work.com',
  namespaces: ['wkcc'],
  objects: ['Employee','EmployeeCrisisAssessment','InternalOrganizationUnit','Crisis'],
  fields: ['Location.Status__c']
},
```

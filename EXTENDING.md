## Extending the Plugin

### **Add or Customize Rules**

The isvte plugin reports are controlled by a set of rules which are executed against an inventory of the package. These rules are defined in the file [rules.ts](src/common/rules.ts). The rules are categorized based on the sections of the report they apply to.

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
      "sfLMA": 1,
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

#### Querying The Inventory

Inventory items are queried using the ```metadataType``` propery within rules. This metadataType is almost exactly a metadataType as defined in the [Metadata API Documentation](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_types_list.htm) but also includes other items that come out of the plugin's inventorying of the package.  Use "." notation to traverse objects. 
To reference Lightning Web Components exposed to App Pages you can do:
```
metadataType: 'LightningComponentBundle.targets.lightning__AppPage'
```

You can also use * as a wildcard, so to identify the api versions of all ApexClasses, you can do:
```
metadataType: 'apiVersions.ApexClass.*'
```
 
#### Rule Conditions
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
```operator``` can be one of: 'always' | 'never' | 'exists' | 'notexists' | 'null' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between'
```operand``` is the numerical value (or the placeholder minAPI) that the operator works agains.

So a condition like:
```
{
  metadataType: 'dependencies.namespaces.sfLMA',
  operator: 'eq',
  operand: 1
}
```
would return true in the sample inventory above.

```conditionAnd``` and ```conditionOr``` are extra conditions that can be used to increase the complexity of a query so the condition:



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
would return true if there are no Flow Templates, but there are Flows.

A condition can have a ```conditionAnd``` or a ```conditionOr``` or neither, but not both. You can however, chain as many ```conditionAnd``` and ```conditionOr``` as needed.

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



#### Rule Results

Several Rule Types have a "Result" component which describes what is presented based on the outcome of the Condition.

A Result is defined as:
```
interface IResult {
  label: string, //Friendly output to display when rule is triggered 
  message: string, //Text block to display
  url?: string, //link to content
  showDetails?: Boolean //Toggle whether individual items that trigger the rule are displayed
}
```

#### Inventory Report Rules

Metadata components listed in the Inventory report are defined in the ```mdTypes``` Array within the rules file. Note that this array defines only what is displayed in the report. It has no impact on what is actually inventoried.

Inventoried items are in the ```mdTypes``` array and conform to the following interface:
```
interface IMetadataType {
  label: string,
  metadataType: string;
}
```
```label``` is the text to be displayed.
```metadataType``` is the item to be counted. 


#### Enablement, Quality, and Partner Alert Rules
Enablement content listed under the **Best Practices and Feature Recommendations** heading us defined in the ```enablementRules``` object.

Code Quality content listed under the **Quality Rules** heading is defined in the ```qualityRules``` object.

Partner Alerts listed under the **Partner Alerts** heading are defined in the ```alertRules``` object.

These rules all follow the general structure:
```
interface IRule {
  name: string, // The Rule Name
  condition: ICondition, // Logic to determine whether the rule is triggered
  resultTrue?: IResult, //Output if the condition is met 
  resultFalse?: IResult //Output if the condition is not met
}
```

#### Edition Installation Rules
The rules which define which instance your package can be installed into are defined in the ```editionWarningRules``` object. They are defined as:
```
interface IInstallRule {
  name: string, //Salesforce Edition
  blockingItems: {label: String, condition: ICondition}[] //Conditions which, if true, mean the package cannot be installed in this edition
}
```

#### Dependency Rules
Dependency Rules identify a dependency on a feature, cloud, or other item. They are defined in the ```dependencyRules``` object and follow the structure:
```
interface IDependecyRule {
  name: string, //Name for the dependency rule
  label: string, //Friendly output of the dependency rule
  condition: ICondition //Condition which fires the dependency rule
}
```

#### Data Models
Data models can be used to automatically create a dependency rule. They are defined in the object ```dataModels``` and follow the structure:
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

For example, work.com uses the wkcc namespace for its managed package and enabling work.com in an org creates the objects "'Employee','EmployeeCrisisAssessment','InternalOrganizationUnit','Crisis'". If a package refers to these items, then there is a dependecy on work.com.

```
{
  name: 'work.com',
  label: 'Work.com',
  namespaces: ['wkcc'],
  objects: ['Employee','EmployeeCrisisAssessment','InternalOrganizationUnit','Crisis'],
  fields: ['Location.Status__c']
},
```


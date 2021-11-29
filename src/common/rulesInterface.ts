/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */


/*
Rules explained:
ruleSet = [rule,rule,...]

rule = {
  name: The Rule Name
  condition: ruleCondition
  resultTrue: result 
  resultFalse: result
}


   
result = {
  label: Friendly output to display when rule is triggered 
  message: Text to display
  url: link to content
  showDetails: boolean
}
A result must have a message and a label
if showDetails is true, then the individual components which pass the condition are included in the result 
e.g the first will output just the message. The second will output the message as well as each individual class with and API version that meets the criteria
{
    name: 'Metadata API Version',
    condition: {
      metadataType: 'apiVersions.mdapi',
      operator: 'between',
      operand: [20,'minAPI'],
    },
    resultTrue: {
      label: 'Using old Metadata API Version',
      message: `You appear to be using a version of Metadata API less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
    },
  },
  {
    name: 'Apex API Version',
    condition: {
      metadataType: 'apiVersions.ApexClass.*',
      operator: 'between',
      operand: [20,'minAPI'],
    },
    resultTrue: {
      label: 'Using old Apex API Version',
      message: `You appear to be using an API version less than the minimum specified. Use the --minapi flag to adjust the minimum API version.`,
      showDetails: true
    }
  },

  If condition resolves to True, then resultTrue is fired. If Condition resolves to false, then resultFalse is fired.
a rule must have a name, a label and a condition. AlertRules, EnablementRules and QualityRules must have  a resultTrue and/or a resultFalse

ruleCondition = {
  metadataType: The Metadata Type to query
  operator: One of: ['always', 'never', 'exists', 'notexists', 'null', 'gt', 'gte', 'lt', 'lte', 'eq','between']
  operand: value that operator works on.
  expiration: dateTime
  processAlways: boolean (only within a conditionOr OR a conditionAnd)
  conditionPerItem: boolean (only within a conditionAnd)
  conditionOr: ruleCondition
  conditionAnd: ruleCondition
}

A ruleCondition must have an operator
If operator is anything other than 'always' or 'never' then ruleCondition must have an operand and a metadataType
If operator is 'between', then operand must be a 2 element array noting the bounds of the between (non inclusive)
ruleCondition cannot have both a conditionAnd AND a conditionOR, but both are optional

OR:
If conditionOr exists, then the result is an OR of the result of the main condition and the conditionOr condition
If processAlways is true within the conditionOr, then conditionOr will be evaluated even if the main condition is already true

AND:
If conditionAnd exists then the resuls is an AND of the result of the main condition and the conditionAnd condition
If process Always is true within the conditionAnd, then conditionAnd will be evaluated even if the main condition is already false.
If conditionPerItem is true within the conditionAnd, then the ultimate result is based on the union of items which pass each side of the condition
  e.g.:
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gte',
      operand: 1,
      conditionAnd: {
        metadataType: 'Flow.objects.*',
        operator: 'gte',
        operand: 1,
      },
    },
    the above condition will resolve to true if there is any object with an apex trigger and if there is any object with a process builder trigger

    If the condition looks like:
    condition: {
      metadataType: 'ApexTrigger.objects.*',
      operator: 'gte',
      operand: 1,
      conditionAnd: {
        metadataType: 'Flow.objects.*',
        operator: 'gte',
        operand: 1,
        conditionPerItem: true
      },
    },
    the condition will resolve to true if any object has both an apex trigger and a process builder trigger.
    */

/*Interface Definitions */

/* Monitored Metadata Types are those which are listed and counted in the output */

interface IMetadataType {
  label: string,
  metadataType: string;
}

type operatorTypes = 'always' | 'never' | 'exists' | 'notexists' | 'null' | 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';

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

interface IResult {
  label: string, //Friendly output to display when rule is triggered 
  message: string, //Text block to display
  url?: string, //link to content
  showDetails?: Boolean //Toggle whether individual items that trigger the rule are displayed
}

interface IRule {
  name: string, // The Rule Name
  condition: ICondition, // Logic to determine whether the rule is triggered
  resultTrue?: IResult, //Output if the condition is met 
  resultFalse?: IResult //Output if the condition is not met
}

interface IInstallRule {
  name: string, //Salesforce Edition
  blockingItems: {label: String, condition: ICondition}[] //Conditions which, if true, mean the package cannot be installed in this edition
}

interface ITrailblazerTech {
  name: string, //Name for the technology to track
  question: string, //Display label for the tech (i.e. the Question that is asked in the Tech Adoption Survey)
  points: number,
  detectable?: Boolean,
  condition?: ICondition, //conditions to count this technology
  levelUp?: IResult //How to leverage this tech to score points
}

interface ITechAdoptionRule {
  categoryName: string, // Category for the Tech score rule
  categoryLabel: string, //Friendly output for the score rule category
  technologies: ITrailblazerTech[]
}

interface IDependecyRule {
  name: string, //Name for the dependency rule
  label: string, //Friendly output of the dependency rule
  condition: ICondition //Condition which fires the dependency rule
}

interface IDataModel {
  name: string, //Name of the cloud or feature this data model describes
  label: string,  //Friendly output of the cloud or feature name
  fields?: string[], //Array of fields (in Object.Field format) included in this datamodel
  objects?: string[], //Array of objects included in this data model
  namespaces?: string[], //Array of namespaces included in this data model
}

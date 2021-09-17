---
title: Reading the Report
lang: en
---

## Analyzing the Report

The resulting report has several different sections for you to take advantage of. The sections of the report are described below.

## Metadata Inventory

The Metadata Inventory portion of the report shows counts for selected metadata types. This portion of the report can be used to keep track of what is included in the package and ensure that nothing extra is slipping in. You can also share this part of your report with your TE, PAM or other Salesforce team member in advance of your conversations with them so that they can better help guide your enablement.

You can alter this portion of the report using the `-s` flag on the command line
- `-s ZeroInventory` will exclude any items from the list that do not exist within the package
- `-s Inventory` will exclude the entire inventory section from the report
 

```
=== Inventory of Package:
Metadata Type                          Count
─────────────────────────────────────  ─────
Permission Sets                        2
Custom Profiles                        4
Custom Metadata                        1
Feature Parameters (Boolean)           0
Feature Parameters (Date)              0
Feature Parameters (Integer)           0
Custom Settings                        0
Custom Labels                          0
Tabs                                   14
Flows                                  1
  Screen Flows                         1
  Flow Templates                       1
    Screen Flow Templates              1
Apex Classes                           24
  With Future Methods                  0
  With Aura Enabled Methods            14
  With Invocable Methods or Variables  0
  Batch Apex                           1
  Apex REST                            0
  SOAP Web Services                    0
  Schedulable Apex                     0
  Test Classes                         3
  Total Apex Characters                96506
Apex Triggers                          1
  Async Triggers                       0
  Total Apex Characters                1720
  Triggers on Interviewer__c           1
Custom Reports                         0
Custom Report Types                    0
Custom Apps                            2
  Lighting Applications                1
   Lighting Consoles                   0
  Classic Applications                 0
   Classic Consoles                    0
Connected Apps                         0
Static Resources                       15
Sharing Rules                          0
Validation Rules                       0
Custom Objects                         12
  Big Objects                          0
  External Objects                     1
Custom Fields                          69
  Total Fields on Standard Objects     3
   Fields on Notification__e           1
   Fields on TwitterApp__mdt           2
  Total Fields on Custom Objects       66
   Fields on Candidate__c              24
   Fields on Interview_Answer__c       6
   Fields on Interview_Questions__c    3
   Fields on Interview__c              8
   Fields on Interviewer__c            7
   Fields on Invoice__c                3
   Fields on Offer__c                  7
   Fields on Position__c               4
   Fields on Referral__c               2
   Fields on Twitter_User__c           2
Platform Events                        0
Territory Management                   0
Territory Management 2.0               0
Visualforce Pages                      5
Aura Web Components                    40
Lightning Web Components               4
  Exposed Components                   2
  RecordPage                           2
  AppPage                              2
  HomePage                             2
Einstein Analytics Applications        0
Einstein Analytics Dashboards          0
Einstein Analytics Dataflows           0
Einstein Analytics Datasets            0
Einstein Analytics Lenses              0
Einstein Analytics Template Bundles    0
Einstein Analytics Dashboards          0
Record Types                           5
In-App guidance                        2

```

## Best Practices and Feature Recommendations

This section contains links to enablement content relevant to the metadata in your package. By leveraging the resources listed here, you can ensure that you're using the platform to its fullest.

This section can be excluded from the report by using the `-s  Enablement` flag on the command line.

```
=== Best Practices and Feature Recommendations:
Visit the ISV Technical Success Center:
For more resources to help build a successful app, visit the ISV Technical Success Center on the Partner Community
URL:http://p.force.com/TECenter

Scan your code for vulnerabilities:
Scan your Apex, Javascript, and Visualforce code for vulnerabilities and violations using the sfdx-scanner plugin. Learn more about sfdx-scanner here.
URL:https://forcedotcom.github.io/sfdx-scanner/

Be aware of packaging limitations for Flows:
There are limitations on Flows within packages. Please review the following document before packaging your flow.
URL:https://help.salesforce.com/articleView?id=flow_considerations_distribute_package.htm

Follow best practices for Batch Apex:
For more information on Batch Apex Design patterns and how best to package Batch Apex, see this webinar.
URL:https://partners.salesforce.com/0693A000006aF9G
```

## Quality Rules

The Quality rules are specific suggestions to improve your customers' experience or to simplify your life as a partner developer.

This section can be excluded from the report by using the `-s  Quality` flag on the command line.


```
=== Quality Rules:
New security features in Apex using API version 48 or higher:
There are new security features added to Apex which greatly simplify FLS checks for Security Review. Update your Apex to API version 48 or higher and review these release notes.
URL:https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_Security_stripInaccessible_GA.htm
	https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_WithSecurityEnforced_GA.htm

New Apex Security Features:
Starting with API version 48, you can use SOQL queries with the WITH SECURITY_ENFORCED modifier as well as the Apex method Security.stripInaccessible to provide FLS and CRUD checks eliminating the need to perform individual field accessibility checks to pass Security Review. Please review the attached release docs for more information
URL:https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_Security_stripInaccessible_GA.htm 
 https://releasenotes.docs.salesforce.com/en-us/spring20/release-notes/rn_apex_WithSecurityEnforced_GA.htm

Use Translations to appeal to a broader audience:
Users prefer to work in their native language. Consider including translations to make your app multilingual
```

## Partner Alerts

Salesforce regularly publishes alerts via email and through the Partner Community. These alerts are important, time sensitive pieces of information that an AppExchange partner should be aware of. The ISVTE plugin will notify you of Partner Alerts that impact your application.

This section can be excluded from the report by using the `-s  Alerts` flag on the command line.

```
=== Partner Alerts:
Stay on Top of Alerts:
Sign up here to be notified of all Partner Alerts
URL:https://sfdc.co/ISVTEAlertsAll

Access Security Changes to Lightning Platform Components Proactive Enablement:
During the Summer ‘21 release, Salesforce will be automatically enforcing the Disable Access to Non-global Apex Controller Methods in Managed Packages and Enforce Access Modifiers on Apex Properties in Lightning Component Markup release updates. View the alert to understand the changes and prepare for their impact.
URL:https://sfdc.co/ISVTEAlert20210209

MFA Mandate - Alert to All Partners (w/ emphasis on OEM/reseller partners):
Beginning February 1, 2022, all users will be required to adopt Multi-Factor Authentication (MFA) to login to Salesforce products, including OEM products and Salesforce products purchased through a reseller.
URL:https://sfdc.co/ISVTEAlert20210202
```

## Installation Warnings

Each Salesforce edition has different limits and restrictions that can impact whether an application can be installed into it. In particular, the entry level orgs like Essentials, Group and Professional limit the metadata types that are available to be used. This section of the report will tell you if you have included any metadata that will limit the editions your application can be installed into.

This section can be excluded from the report by using the `-s  Warnings` flag on the command line.


```
=== Installation Warnings
Package cannot be installed in Essentials due to:
  Record Types 
  Custom Profiles 


Package cannot be installed in Group Edition due to:
  Record Types 
  Custom Profiles 


Package cannot be installed in Professional Edition due to:
  Platform Cache 
```

## Dependencies

The ISVTE Plugin performs a static check for dependencies within your application. This dependency check is not the same as the [Dependency API](https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_metadatacomponentdependency.htm). Instead, the ISVTE Plugin looks at namespaces, interfaces, objects, and features used in your application and identifies clouds, apps and features that your application is dependent upon.

You may recieve a request on occasion from your TE, TAM or PAM to check for specific dependencies in order for Salesforce to assess the partner impact of upcoming changes.

This section of the report can be suppressed along with the Installation Warnings using the `-s Warnings` flag.

```
=== Dependencies:
Community Cloud
Namespaces:
	force
	instock
	testautonumdata
```
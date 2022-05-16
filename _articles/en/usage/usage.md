---
title: Plugin Usage
lang: en
---

## Running the Plugin
At its simplest, to run the ISVTE Plugin you point it to a folder containing an sfdx project or a package.xml file plus the associated metadata.

```
jhaydraude:demo>ls mdout
applications		flexipages		profiles
aura			flows			prompts
cachePartitions		layouts			quickActions
classes			lwc			remoteSiteSettings
contentassets		objects			staticresources
customMetadata		package.xml		tabs
documents		pages			triggers
email			permissionsets
jhaydraude:demo>sfdx isvte:mdscan -d mdout
```



## Modifying the Report

The output report can be modified to include or exclude specific sections. Refer to [Reading the Report](./en/usage/report) for more information on how to modify each section of the report.

## JSON output

The Text report contains only a portion of the information collected by the ISVTE Plugin. For more information including the detailed inventory, pass the `--json` flag to your command. Note that `--json` ignores the sections that suppress sections of the report.
You can use this report to programatically act upon some of the recommendations. In particular, the Partner Alerts section can be interesting to automate within a CI/CD process to notify you when a potentially breaking issue is identified.

```
jhaydraude:demo>sfdx isvte:mdscan -d mdout --json                              
```

The resulting JSON object is structured like this:

```
{
  "status": 0,
  "result": {
    "Status": {
      "Date": "Fri, 17 Sep 2021 20:48:20 GMT",
      "RulesVersion": "20210324"
    },
    "MetadataInventory": {
      <The detailed inventory of your packge>
    },
    "MonitoredItems": [
      <Inventory Report>
    ],
    "Recommendations": [
      <Best Practices and Feature Recommendations Report>
    ],
    "CodeQualityNotes": [
      <Quality Rules Report>
    ],
    "Alerts": [
      <Partner Alerts>
    ],
    "InstallationWarnings": [
      <Edition Installation Warnings Report>
    ],
    "Dependencies": [
      <Dependencies Report>
    ],
    "AdoptionScore": [
      <Tech Adoption Score Report>
    ],
    "LanguageWarnings": {
      <Inclusive Language warnings report>
    },
```
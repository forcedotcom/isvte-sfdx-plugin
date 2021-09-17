---
title: Plugin Usage
lang: en
---

## Running the Plugin
At its simplest, to run the ISVTE Plugin you point it to a folder containing a package.xml file plus the associated metadata.

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

## sfdx Source format

Packages can be delivered in one of 2 formats: traditional metadata format or SalesforceDX source format. Ultimately, all packages end up in Metadata format regardless of how they are created and this is the format that the ISVTE Plugin uses.

If you're developing your code with VSCode and SalesforceDX you still have 2 ways to use the ISVTE Plugin.

1. Supply a package.xml
Using a generated package.xml, you can use the `-p` flag on the `isvte:mdscan` command to pass your package.xml and let the tool know which metadata components you're interested in scanning.
```
sfdx isvte:mdscan -p source/package.xml -d force-app
```

2. Convert the source to metadata format
Using native sfdx functionality, you can easily convert your source to metadata format then execute the plugin against it.

```
jhaydraude:demo>sfdx force:source:convert -d mdconverted
Source was successfully converted to Metadata API format and written to the location: /Users/jhaydraude/Development/Projects/ISVTEPluginDemo/mdconverted
jhaydraude:demo>sfdx isvte:mdscan -d mdconverted
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
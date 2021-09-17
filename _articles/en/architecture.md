---
title: Design
lang: en
---

## Salesforce ISVTE Plugin Architecture

ISVTE Plugin is a patented open-source [Salesforce CLI plugin](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture.htm). The code is written in Typescript in the NodeJS framework.

## Salesforce ISVTE Plugin Internals

The ISVTE Plugin has 3 main components:

1. Metadata Processing
Everything starts with a detailed inventory of the package metadata. In addition to a pure index of metadata components, the inventory includes important attributes specific to various metadata types. For example, the inventory of Apex classes also includes information on api versions, method decorators, and implemented interfaces. The output of the Metadata Processing engine is a very detailed inventory of your package in JSON format.

2. Rules Processing
A custom Rules Processing engine is executed against the inventory compiled by the Metadata Processing engine. The rules determine what actions should fire based on combinations of metadata (or metadata attributes) are identified within the inventory. There are many rules which come included with the plugin and [you can also add your own](./en/extending). The output of the Rules Processing engine is a JSON object containing the results of all triggered rules.

3. Report

The final stage of the plugin execution is the report. This report is a formatted display of the output of the Rules Processing engine. The report is available in text, html, or JSON format.

-------

![Plugin Architecture](./assets/images/ISVTEPluginFlow.png)


## Source Code and Contribution

The code for the ISVTE plugin is in [this GitHub repo](https://github.com/forcedotcom/isvte-sfdx-plugin). Salesforce is actively working on expanding and improving the tool.




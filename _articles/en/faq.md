---
title: 'Frequently Asked Questions'
lang: en
---


## Q: What is Salesforce ISV Technical Enablment Plugin?
A: Salesforce ISV Technical Enablment Plugin (ISVTE Plugin) is a [Salesforce CLI](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture.htm) plug-in that helps developers take full advantage of the Salesforce Platform while avoiding potential pitfalls.

The plug-in generates a detailed inventory of your application metadata. Based on that, it identifies helpful resources, relevant alerts and other best practices.
You can run the plugin on-command in the CLI, or integrate it into your CI/CD framework so you can run it against every code change.

## Q: What else do I need before I can use ISVTE Plugin?
A: The ISVTE Plugin requires you to install the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) on your computer. Then you can install the ISVTE Plugin with the command `sfdx plugins:install isvte-sfdx-plugin`.
See [Getting Started](./en/getting-started/prerequsites) for more information.

## Q: How do I update the ISVTE Plugin?
A: You must:
- Update the plugin to the latest version by following the instructions listed [here](./en/getting-started/install/#upgrade-plug-in)

## Q: Is ISVTE Plugin part of the App Exchange security review process?
A: The ISVTE Plugin can help you with the security review process by guiding you toward security best practices, but it is not a part of the overall process

## Q: How do I add new rules?
A: Check the [Extending the Plugin](./en/extending/) section for information on how the plugin rules work and how to create your own.

## Q: How can I use ISVTE Plugin in my CI/CD?
A: You can use the `sfdx isvte:mdscan` command in any scripts used by your CI/CD. You'll also probably want to do the following:
- Use the `--json` flag to create the report as a JSON object which can be acted upon programatically.
- **Or** pipe the output to a text file so you can retain an artifact of the execution `sfdx isvte:mdscan -d metadata | out.txt`.

## Q: How do I run the ISVTE Plugin against an sfdx project?
A: The `ISVTE Plugin` starts its work based on a `package.xml` file and so it natively supports metadata format, not sfdx source format. If you're using an sfdx project, you can either pass your own package.xml using the `-p` flag or you can convert your app to metadata format using the sfdx command `sfdx force:source:convert`.
---
title: Salesforce CLI Scanner Plug-In
permalink: /
lang: en
---

<div class="slds-notify slds-notify_alert slds-theme_alert-texture slds-text-heading_small slds-text-align_center slds-theme_warning" role="alert">
  <span class="slds-assistive-text">warning</span>
  	A new version (v{{ site.data.versions.scanner }}) of the Scanner Plug-in was released on {{ site.data.versions.releasedon }} &nbsp;&nbsp;<a href="./en/release-information/">Release Information</a>
</div>
<br>

## Salesforce CLI Scanner Plug-in

The Salesforce CLI Scanner plug-in is a unified tool for static analysis of source code, in multiple languages
(including Apex), with a consistent command-line interface and report output. We currently support the
[PMD rule engine](https://pmd.github.io/), [PMD Copy Paste Detector](https://pmd.github.io/latest/pmd_userdocs_cpd.html), [ESLint](https://eslint.org/), and [RetireJS](https://retirejs.github.io/retire.js/).
We may add support for more rule engines in the future.

The Salesforce CLI Scanner Plug-in creates "Rule Violations" when the scanner identifies issues. Developers use this information as feedback to fix their code. 

You can integrate this plug-in into your CI/CD solution to enforce the rules and expect high-quality code.

## Additional Resources

- Trailhead: [Get Started with Salesforce DX](https://trailhead.salesforce.com/trails/sfdx_get_started)
- [Salesforce DX Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev)

### Open Source

- [Github Repository](https://github.com/forcedotcom/sfdx-scanner)

## Bugs and Feedback

To report issues with Salesforce Scanner, open a [bug on GitHub](https://github.com/forcedotcom/sfdx-scanner/issues/new?template=Bug_report.md). If you want to suggest a feature, create a [feature request on GitHub](https://github.com/forcedotcom/sfdx-scanner/issues/new?template=Feature_request.md).



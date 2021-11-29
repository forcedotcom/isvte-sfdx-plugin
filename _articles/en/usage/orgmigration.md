---
title: Supporting Org Migrations
lang: en
---


## Customer Org Migrations

The ISVTE Plugin can and will identify exceptions to best practices that impact [Org Migrations](https://help.salesforce.com/s/articleView?language=en_US&type=1&id=000334938). In particular, [Hyperforce](https://help.salesforce.com/s/articleView?id=000356459&type=1) has strick requirements against having Hard-coded URLs within your application and a Hyperforce migration will fail if a HardCoded URL exists within your package.

When you run the ISVTE Plugin against your package, pay close attention to the best practice alert "Do Not use Hard-Coded URLs to access Salesforce Orgs."

This particular check looks through your code and identifies URLs that include Salesforce instance names. Follow the instructions [here](https://help.salesforce.com/s/articleView?id=000335670&type=1) to fix those links and ensure that your customers are able to use Hyperforce.


```
=== Quality Rules:
Do Not use Hard-Coded URLs to access Salesforce Orgs:
Hard-Coded URLs which reference instance names like https://na144.salesforce.com can cause customer org migrations to fail. Use <mydomain>.my.salesforce.com or login.salesforce.com instead
URL:https://help.salesforce.com/s/articleView?id=000335670&type=1
Components: ConnApp2, unfiled$public/ClassicCustom, unfiled$public/ClassicHTML, unfiled$public/ClassicText, unfiled$public/ClassicVF, NC1, RSS1, rss2
```
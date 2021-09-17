---
title: Language Scanner
lang: en
---

## Background
As part of Salesforce’s core value of “Equality” we have been [working towards removing non-inclusive or potentially offensive language from our products](https://www.salesforce.com/news/stories/how-were-bringing-inclusive-language-to-our-products/). We encourage our AppExchange partners to share this value to help foster an inclusive environment for all of our customers.

The ISVTE Plugin can help here. It uses the [Alex](https://alexjs.com/) scanning engine to search for potentially exclusionary or profane language. The language scanner looks at the following:
* Apex/Triggers including all code and comments. 
* Aura/LWC Lightning Components including HTML Markup and Javascript controllers.
* Visualforce
* User facing metadata in Custom Objects, Labels, Custom Fields and Flows — Descriptions, Labels, Help text, Names


## Usage
You can run the language scanner by passing the optional `-l` flag to the `isvte:mdscan` command.
```
jhaydraude:demo>sfdx isvte:mdscan -d mdout -l
```

When potentially problematic language is found, the report will tell you where it is and some justification for why it was flagged. Note that language is extremely contextual and subjective. We cannot guarantee that passing the language scanner will find all issues, nor can we guarantee that everything identified is actually problematic.

```
=== Language Warnings
Language scan is provided by https://github.com/get-alex/
Metadata Type: ApexClass
	MyBatchClass
		Source:     //Hackey bit to get around those stupid governor limits
		Exception: `stupid` may be insensitive, use `foolish`, `ludicrous`, `unintelligent` instead
		Line: 30
		Details: Source: http://www.mmonjejr.com/2014/02/deconstructing-stupid.html
```

## Engine
The ISVTE Plugin language scanner leverages the open source tool [Alex](https://alexjs.com/). The Alex engine relies on the retext lists of flagged words and their alternatives.
* Equality Rules: [https://github.com/retextjs/retext-equality/blob/master/rules.md#list-of-rules](https://github.com/retextjs/retext-equality/blob/master/rules.md#list-of-rules)
* Profanity Rules: [https://github.com/retextjs/retext-profanities/blob/master/rules.md](https://github.com/retextjs/retext-profanities/blob/master/rules.md) (This list is predictably NSFW)
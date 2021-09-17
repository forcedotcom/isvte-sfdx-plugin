---
title: Tech Adoption Scorecard
lang: en
---

## Background
As part of the AppExchange Partner Program, ISV Partners are assigned a Tier based on (among other things) the technologies used within their application. Salesforce sends a quarterly Technology Adoption survey asking about key technologies and whether they are used. The ISVTE Plugin, being aware of all of your metadata, is able to populate much of this survey for you.

To help answer the questions in your tech adoption survey, run the ISVTE Plugin with the `-t` flag.

## Usage
```
jhaydraude:demo>sfdx isvte:mdscan -d mdout -t
```

The output will look like the survey you recieved.

```
=== Technology Adoption:
The responses below correspond to the ISV Technology Adoption Survey for FY'22.
Please note that the points and answers are not indended to be exhaustive and only reflect that which can be identified within the metadata source.
Access the Survey here: https://www.getfeedback.com/r/2ssZhMKB/


User Experience (30 Points)

 1. Lightning Web Components: Does your application metadata contain Lightning web components? (10 Points) 
   Found 
	Find more information about how to leverage the power of LWC and for best practices, see this webinar.
	URL:https://partners.salesforce.com/0693A000007Kd7oQAC


 2. In-App Guidance: Does your application metadata contain In-App Guidance for walkthroughs? (10 Points) 
   Found 
	For more information about how to use In-App Prompts to keep your users informed, see this blog.
	URL:https://medium.com/inside-the-salesforce-ecosystem/in-app-prompts-for-isvs-e9b013969016


 3. Lightning Flow: Does your application metadata contain Lightning Flows? (10 Points) 
   Found 
	Flows are a powerful tool to enable forms based workflows and process automation to your users. See this webinar for more information.
	URL:https://partners.salesforce.com/0693A000007S2Dq




Analytics & Einstein (0 Points)

 1. Reports and Dashboards: Does your application metadata contain custom reports or dashboards? (5 Points) 
   Not Found 


 2. TableauCRM: Does your application metadata contain custom analytics implemented using Tableau CRM (formerly Einstein Analytics)? (10 Points) 
   Not Found 
	Start here to learn how to use TableauCRM in your application
	URL:https://sfdc.co/ISVTETCMGetStarted

```

For each question, there are 3 possible results:
- `Found`: The ISVTE Plugin identified the metadata or technology listed
- `Not Found`: The ISVTE Plugin did not identify the metadata or technology listed
- `Not Identifiable in Metadata`: The technology in question is not packagable and therefore the ISVTE Plugin cannot answer the question.

 
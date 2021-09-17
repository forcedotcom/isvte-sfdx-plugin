---
title: Salesforce ISVTE Plug-In Command Reference
lang: en
---

## sfdx isvte:listrules 
Outputs all of the configured rules

## Usage 
```
   $ sfdx isvte:listrules [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]
```
## Options
```
  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATA
  L)
      [default: warn] logging level for this command invocation

```

## Examples
Display the enablement rules and edition warnings which are checked by the 
  isvte plugin:
  ```
  	$sfdx isvte:listrules
  ```
  
  Display this help message:
  ```
  	$sfdx isvte:listrules -h
  ```
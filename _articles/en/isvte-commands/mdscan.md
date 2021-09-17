---
title: Salesforce CLI Scanner Plug-In Command Reference
lang: en
---

## sfdx isvte:mdscan 
Scans the package contained in the specified directory and generates a report.


## Usage 
```
  $ sfdx isvte:mdscan [-d <directory>] [-p <string>] [-y] [-s <array>] [-t] [--minapi <integer>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]
```
## Options
```
  -d, --sourcefolder=sourcefolder                                                   [default: mdapiout] directory containing package metadata
  -p, --sfdxpackagexml=sfdxpackagexml                                               path to a package.xml file if current folder is a SFDX Project

  -s, --suppress=suppress                                                           comma separated list of items to suppress.
                                                                                    Valid options are: ZeroInventory, Inventory, Enablement, Quality, Alerts, 
                                                                                    Warnings, API

  -t, --techadoption                                                                Show Tech Adoption calculation for Trailblazer scoring

  -y, --showfullinventory                                                           show package inventory only

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for this command invocation

  --minapi=minapi                                                                   [default: 43] minimum api version to use during quality checks

```

## Examples

  Scan a package and provide inventory of monitored metadata items and enablement messages:
```
  	$sfdx isvte:mdscan -d ./mdapi
```

  Scan a package using a SFDX project and a package.xml file:
```
  	$sfdx isvte:mdscan -d ./force-app/main/default -p ./config/package.xml
```

  Scan a package and provide a complete inventory of package metadata:
```  
  	$sfdx isvte:mdscan -d ./mdapi -y
```

  Do not display alerts and warnings:
```
  	$sfdx isvte:mdscan -d ./mdapi -s alerts,warnings
```

  Display the help message:
```
  	$sfdx isvte:mdscan -h
```


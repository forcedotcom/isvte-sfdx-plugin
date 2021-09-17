---
title: Install ISVTE Plugin
lang: en
---

## Install the plugin

### Install as a SalesforceDX Plugin

```  
sfdx plugins:install isvte-sfdx-plugin
```
You will be prompted to confirm that you want to install an unsigned plugin. Choose yes
```  
This plugin is not digitally signed and its authenticity cannot be verified. Continue installation y/n?: y
```

To prevent this message from appearing, you can add this to the Allow List by [adding an entry for it in $HOME/.config/sfdx/unsignedPluginAllowList.json](https://developer.salesforce.com/blogs/2017/10/salesforce-dx-cli-plugin-update.html).

CI Users: As the plugin is not signed, to install it from a Dockerfile or a script:
```
    echo 'y' | sfdx plugins:install isvte-sfdx-plugin
```

### Install from source
1. Clone the repository
```  
git clone https://github.com/forcedotcom/isvte-sfdx-plugin.git
```
2. Link the plugin:
```
sfdx plugins:link isvte-sfdx-plugin/
```


### Check that the ISVTE plugin is installed
```bash
$ sfdx plugins
isvte-sfdx-plugin {{ site.data.versions.scanner }}
```

## Upgrade plugin
To update the ISVTE plugin to the latest version, you can follow the next step.

```bash
$ sfdx plugins:update
sfdx-cli: Updating plugins... done

$ sfdx plugins:update --help
update installed plugins

USAGE
  $ sfdx plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

```

For more information on how to manage the installed plugins or Auto Update, visit [CLI help](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_update_cli.htm#sfdx_setup_update_cli)


/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Logger
} from '@salesforce/core';

export class Loggit {
  private isvteLogger;
  private loggerName;

  public constructor(loggerName = 'isvtePlugin') {
    this.loggerName = loggerName;
   // this.isvteLogger = Logger.child(this.loggerName);
  }

  public async logLine(logMessage : string, type : string = '') {
    if (this.isvteLogger == undefined) {
      this.isvteLogger = await Logger.child(this.loggerName);
    }
     switch (type) {
      case 'Error': {
          this.isvteLogger.error(logMessage + ' -> ' + Loggit.getParent());
          break;
        }
      case 'Warn': {
          this.isvteLogger.warn(logMessage + ' -> ' + Loggit.getParent());
          break;
        }
      default: {
          this.isvteLogger.debug(logMessage + ' -> ' + Loggit.getParent());
          break;
        }
      }
    }

    public async logJSON(logMessage: any, type: string = '') {
      this.logLine(JSON.stringify(logMessage),type);
    };

 
  static getParent() {
    let parents = [];
    const stackRegex = /^\s+at\s+(\w+(?:\.\w+)*)\s+\(/gm;
    try {
      throw new Error();
    } catch (e) {
      // matches this function, the caller and the parent

      let match;
      while (match = stackRegex.exec(e.stack)) {
       // if (match[1] !== 'getParent' && match[1] !== 'Object.logLine') {
          parents.push(match[1]);
       // }
      }
    }
    return parents.join(':');
  };

}

export async function logLine(namespace : string, logMessage : string, type : string = '') {
const logger = new Loggit(namespace);
logger.logLine(logMessage,type);
}






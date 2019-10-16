/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Logger
} from '@salesforce/core';

export class loggit {
  private isvteLogger;
  private loggerName;

  public constructor(loggerName = 'isvtePlugin') {
    this.loggerName = loggerName;
  }

  public async loggit(logMessage, type = ''): Promise < any > {
    if (this.isvteLogger == undefined) {
      this.isvteLogger = await Logger.child(this.loggerName);
    }
    switch (type) {
      case 'Error': {
        this.isvteLogger.error(logMessage);
        break;
      }
      case 'Warn': {
        this.isvteLogger.warn(logMessage);
        break;
      }
      default: {
        this.isvteLogger.debug(logMessage);
        break;
      }
    }
  }
}

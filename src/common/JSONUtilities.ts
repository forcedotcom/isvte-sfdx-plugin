export function addKeyToObject(destObject: Object, path: string) : any {
  return _addKeyToObject(destObject, path.split('.'));
}

function _addKeyToObject(destObject: Object, pathComponents: string[]) : any {

  let topKey = pathComponents.shift();
  if (!destObject.hasOwnProperty(topKey)) {
    destObject[topKey] = {};
  }
  if (pathComponents.length > 0) {
    return _addKeyToObject(destObject[topKey], pathComponents);
  }
  else {
    return destObject[topKey];
  }
}

export function setValue(destObject: Object, path: string, value: any) : any {
  return _setValue(destObject,path.split('.'),value);

}

function _setValue(destObject: Object, pathComponents: string[], value: any) : any {
  let topKey = pathComponents.shift();

  if (pathComponents.length == 0) {
    //This is the end. Set the value;
    destObject[topKey] = value;
    return destObject[topKey];
  }
  else {
    if (!destObject.hasOwnProperty(topKey)) {
      //If key doesn't exist, create it as empty object
      destObject[topKey] = {};
    }
    return _setValue(destObject[topKey],pathComponents,value);
  }

}

export function incrementValue(destObject: Object, path: string) : number {
  let val = getValue(destObject,path,0);
  if (isNaN(val)) {
    throw `${val} at path ${path} is Not a Number. Cannot Increment`;
  }
  val += 1;
  return setValue(destObject,path,val);
}

export function getValue(srcObject: Object, path: string, defaultValue: any = null) : any {
  return _getValue(srcObject,path.split('.'),defaultValue);
}

function _getValue(srcObject: Object, pathComponents: string[], defaultValue: any = null) : any {
  let topKey = pathComponents.shift();
  if (srcObject.hasOwnProperty(topKey)) {
    if (pathComponents.length > 0) {
      return _getValue(srcObject[topKey],pathComponents,defaultValue);
    }
    else {
        return srcObject[topKey];
    }
  }
  else {
    return defaultValue;
  }
}

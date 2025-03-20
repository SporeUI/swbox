interface TypelogObj {
  [key: string]: number | string,
};
let logObj: TypelogObj = {};

export const logger = () => {
  return logObj;
};

export const setLog = (name: string, time: number | string) => {
  logObj[name] = logObj[name] || time;
};

export const clearLog = () => {
  logObj = {};
};

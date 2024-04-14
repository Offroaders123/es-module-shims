declare global {
  var ESMS_DEBUG: boolean | undefined;
  var _d: (<T extends string>(module: T) => any) | undefined;
  var _esmsi: unknown;

  interface Navigator {
    userAgentData: object;
  }
}

export {};
export const hasWindow = typeof window !== 'undefined';
export const hasDocument = typeof document !== 'undefined';

export const noop = () => {};

const optionsScript: HTMLScriptElement | null = hasDocument ? document.querySelector<HTMLScriptElement>('script[type=esms-options]') : null;

export const esmsInitOptions: ESMSInitOptions = optionsScript ? JSON.parse(optionsScript.innerHTML) : {};
Object.assign(esmsInitOptions, self.esmsInitOptions || {});

export let shimMode: boolean = hasDocument ? !!esmsInitOptions.shimMode : true;

export const importHook = globalHook(shimMode && esmsInitOptions.onimport);
export const resolveHook = globalHook(shimMode && esmsInitOptions.resolve);
export let fetchHook = esmsInitOptions.fetch ? globalHook(esmsInitOptions.fetch) : fetch;
export const metaHook = esmsInitOptions.meta ? globalHook(shimMode && esmsInitOptions.meta) : noop;

export const mapOverrides = esmsInitOptions.mapOverrides;

export let nonce = esmsInitOptions.nonce;
if (!nonce && hasDocument) {
  const nonceElement = document.querySelector<HTMLScriptElement>('script[nonce]');
  if (nonceElement)
    nonce = Boolean(nonceElement.nonce || nonceElement.getAttribute('nonce'));
}

export const onerror = globalHook(esmsInitOptions.onerror || noop);
export const onpolyfill = esmsInitOptions.onpolyfill ? globalHook(esmsInitOptions.onpolyfill) : () => {
  console.log('%c^^ Module TypeError above is polyfilled and can be ignored ^^', 'font-weight:900;color:#391');
};

export const { revokeBlobURLs, noLoadEventRetriggers, enforceIntegrity } = esmsInitOptions;

function globalHook (name) {
  return typeof name === 'string' ? self[name] : name;
}

const enable = Array.isArray(esmsInitOptions.polyfillEnable) ? esmsInitOptions.polyfillEnable : [];
export const cssModulesEnabled = enable.includes('css-modules');
export const jsonModulesEnabled = enable.includes('json-modules');

declare global {
  interface Navigator {
    userAgentData?: object;
  }
}

export const edge = !navigator.userAgentData && !!navigator.userAgent.match(/Edge\/\d+\.\d+/);

export const baseUrl = hasDocument
  ? document.baseURI
  : `${location.protocol}//${location.host}${location.pathname.includes('/') 
    ? location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1) 
    : location.pathname}`;

export const createBlob = (source: BlobPart, type = 'text/javascript') => URL.createObjectURL(new Blob([source], { type }));
export let { skip } = esmsInitOptions;
if (Array.isArray(skip)) {
  const l = skip.map(s => new URL(s, baseUrl).href);
  skip = ((s: string) => l.some(i => i[i.length - 1] === '/' && s.startsWith(i) || s === i)) as unknown as RegExp;
}
else if (typeof skip === 'string') {
  const r = new RegExp(skip);
  skip = ((s: string) => r.test(s)) as unknown as RegExp;
}

const eoop = (err: Error) => setTimeout(() => { throw err });

declare global {
  var safari: unknown;
}

export const throwError = (err: Error) => { (self.reportError || hasWindow && window.safari && console.error || eoop)(err), void onerror(err) };

export function fromParent (parent: string) {
  return parent ? ` imported from ${parent}` : '';
}

export let importMapSrcOrLazy = false;

export function setImportMapSrcOrLazy () {
  importMapSrcOrLazy = true;
}

// shim mode is determined on initialization, no late shim mode
if (!shimMode) {
  if (document.querySelectorAll<HTMLLinkElement | HTMLScriptElement>('script[type=module-shim],script[type=importmap-shim],link[rel=modulepreload-shim]').length) {
    shimMode = true;
  }
  else {
    let seenScript = false;
    for (const script of document.querySelectorAll<HTMLScriptElement>('script[type=module],script[type=importmap]')) {
      if (!seenScript) {
        if (script.type === 'module' && !script.ep)
          seenScript = true;
      }
      else if (script.type === 'importmap' && seenScript) {
        importMapSrcOrLazy = true;
        break;
      }
    }
  }
}

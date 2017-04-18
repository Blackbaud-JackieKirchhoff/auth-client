export class BBOmnibarScriptLoader {

  public static registerScript(url: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      let scriptEl = document.createElement('script');

      scriptEl.onload = resolve;
      scriptEl.onerror = reject;

      scriptEl.src = url;

      document.body.appendChild(scriptEl);
    });
  }

  public static smartRegisterScript(url: string, minVersion: string, currentVersion?: string): Promise<any> {
    if (currentVersion && BBOmnibarScriptLoader.isVersionMet(minVersion, currentVersion)) {
      return Promise.resolve();
    }

    return BBOmnibarScriptLoader.registerScript(url);
  }

  private static isVersionMet(min: string, cur: string): boolean {
    let minVersion = BBOmnibarScriptLoader.parseVersionString(min);
    let currentVersion = BBOmnibarScriptLoader.parseVersionString(cur);

    for (let idx = 0; idx < minVersion.length; idx++) {
      if (idx < currentVersion.length) {
        if (currentVersion[idx] > minVersion[idx]) {
          return true;
        } else if (currentVersion[idx] < minVersion[idx]) {
          return false;
        }
      }
    }
    return true;
  }

  private static parseVersionString(str: string): number[] {
    let splitVersion = str.split('.');
    let parsedVersion = [];

    for (let num of splitVersion) {
      let versionNum: number = parseInt(num, 10) || 0;
      parsedVersion.push(versionNum);
    }
    return parsedVersion;
  }
}
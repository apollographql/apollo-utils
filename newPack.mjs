import { PublishCommand } from '@lerna/publish';

(async () => {

  const publish = new PublishCommand({ composed: false, cwd: __dirname });
  debugger;
})();
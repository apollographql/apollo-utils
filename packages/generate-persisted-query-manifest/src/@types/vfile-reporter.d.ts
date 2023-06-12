declare module "vfile-reporter" {
  import type { VFile } from "vfile";

  interface ReporterOptions {
    verbose?: boolean;
    quiet?: boolean;
    silent?: boolean;
    color?: boolean;
    defaultName?: string;
  }

  function reporter(files: VFile[], options?: ReporterOptions): string;

  export = reporter;
}

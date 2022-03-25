import { PassThrough } from "stream";
import * as winston from "winston";
import WinstonTransport from "winston-transport";
import * as bunyan from "bunyan";
import * as loglevel from "loglevel";
import * as log4js from "log4js";
import type { Logger } from "..";

const LOWEST_LOG_LEVEL = "debug";
const KNOWN_DEBUG_MESSAGE = "This is a debug message";

// For typechecking the logger in question's compatibility
// with the Logger interface.
interface HasLogger {
  logger: Logger;
}

describe("Logger interface compatibility", () => {
  it("with loglevel", () => {
    const sink = jest.fn();
    const logger = loglevel.getLogger("test-logger-loglevel");

    logger.methodFactory =
      (_methodName, level): loglevel.LoggingMethod =>
      (message) =>
        sink({ level, message });

    // The `setLevel` method must be called after overwriting `methodFactory`.
    // This is an intentional API design pattern of the loglevel package:
    // https://www.npmjs.com/package/loglevel#writing-plugins
    logger.setLevel(loglevel.levels.DEBUG);

    // type checks Logger interface compatibility
    const hasLogger: HasLogger = { logger };

    hasLogger.logger.debug(KNOWN_DEBUG_MESSAGE);

    expect(sink).toHaveBeenCalledWith({
      level: loglevel.levels.DEBUG,
      message: KNOWN_DEBUG_MESSAGE,
    });
  });

  it("with log4js", () => {
    const sink = jest.fn();

    log4js.configure({
      appenders: {
        custom: {
          type: {
            configure: () => (loggingEvent: log4js.LoggingEvent) =>
              sink(loggingEvent),
          },
        },
      },
      categories: {
        default: {
          appenders: ["custom"],
          level: LOWEST_LOG_LEVEL,
        },
      },
    });

    const logger = log4js.getLogger();
    logger.level = LOWEST_LOG_LEVEL;

    // type checks Logger interface compatibility
    const hasLogger: HasLogger = { logger };

    hasLogger.logger.debug(KNOWN_DEBUG_MESSAGE);

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        level: log4js.levels.DEBUG,
        data: [KNOWN_DEBUG_MESSAGE],
      }),
    );
  });

  it("with bunyan", () => {
    const sink = jest.fn();

    // Bunyan uses streams for its logging implementations.
    const writable = new PassThrough();
    writable.on("data", (data) => sink(JSON.parse(data.toString())));

    const logger = bunyan.createLogger({
      name: "test-logger-bunyan",
      streams: [
        {
          level: LOWEST_LOG_LEVEL,
          stream: writable,
        },
      ],
    });

    // type checks Logger interface compatibility
    const hasLogger: HasLogger = { logger };

    hasLogger.logger.debug(KNOWN_DEBUG_MESSAGE);

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        level: bunyan.DEBUG,
        msg: KNOWN_DEBUG_MESSAGE,
      }),
    );
  });

  it("with winston", () => {
    const sink = jest.fn();
    const transport = new (class extends WinstonTransport {
      constructor() {
        super({
          format: winston.format.json(),
        });
      }

      override log(info: any) {
        sink(info);
      }
    })();

    const logger = winston.createLogger({ level: "debug" }).add(transport);

    // type checks Logger interface compatibility
    const hasLogger: HasLogger = { logger };

    hasLogger.logger.debug(KNOWN_DEBUG_MESSAGE);

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LOWEST_LOG_LEVEL,
        message: KNOWN_DEBUG_MESSAGE,
      }),
    );
  });
});

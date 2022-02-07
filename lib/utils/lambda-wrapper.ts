/* eslint-disable max-lines */
import * as Sentry from '@sentry/serverless';
import { Context, Handler, APIGatewayProxyEventV2 } from 'aws-lambda';
import { Pool } from 'pg';
import { initPool } from '../../src/commons/clients/db/db-client';
import { Hubspot } from '../../src/commons/clients/hubspot';
import { notifyChannel as notifySlackChannel } from '../../src/commons/clients/slack';
import { getSecrets } from '../../src/commons/utils';
import { MailService } from '@sendgrid/mail';
import moment = require('moment');
import { IntercomClient } from '../../src/commons/clients/intercom';
export interface OrientContext extends Context {
    services: {
        hubspot: Hubspot;
        db: Pool;
        sendgrid: MailService;
        intercom:IntercomClient;

    }
    stage: string;
}

export type OrientServices = "hubspot" | "db" | "intercom" | "sendgrid"

export interface WrapperOptions {
    flushTimeout: number;
    rethrowAfterCapture: boolean;
    callbackWaitsForEmptyEventLoop: boolean;
    captureTimeoutWarning: boolean;
    timeoutWarningLimit: number;
    initServices: Array<OrientServices>;
    /**
     * Capture all errors when `Promise.allSettled` is returned by the handler
     * The {@link wrapHandler} will not fail the lambda even if there are errors
     * @default false
     */
    captureAllSettledReasons: boolean;
}

/**
 * Tries to invoke context.getRemainingTimeInMillis if not available returns 0
 * Some environments use AWS lambda but don't support this function
 * @param context
 */
function tryGetRemainingTimeInMillis(context: Context): number {
    return typeof context.getRemainingTimeInMillis === 'function' ? context.getRemainingTimeInMillis() : 0;
}

/**
 * Adds additional information from the environment and AWS Context to the Sentry Scope.
 *
 * @param scope Scope that should be enhanced
 * @param context AWS Lambda context that will be used to extract some part of the data
 * @param startTime performance.now() when wrapHandler was invoked
 */
async function initOrientService(service: OrientServices, context: OrientContext, startTime: number): Promise<OrientContext> {

    context.services = context.services ? context.services : {} as any;
    switch (service) {
        case "hubspot": {
            const secrets = await getSecrets();
            context.services.hubspot = new Hubspot(secrets.hapikey);
            break;
        }
        case "db": {
            const secrets = await getSecrets();
            context.services.db = await initPool(JSON.parse(secrets.bi_data_db));
            break;
        }
        case "sendgrid": {
            const secrets = await getSecrets();
            context.services.sendgrid = new MailService();
            context.services.sendgrid.setApiKey(secrets.sendgrid_api_key);
            break;
        }
        case "intercom": {
            const secrets = await getSecrets();
            context.services.intercom = new IntercomClient(secrets.intercom_token);
            break;
        }
    }

    return context
}



/**
 * Wraps a lambda handler adding it error capture and tracing capabilities.
 *
 * @param handler Handler
 * @param options Options
 * @returns Handler
 */

export type OrientHandler<TEvent = any, TResult = any> = (
    event: TEvent,
    context: OrientContext,
    callback?: any,
) => void | Promise<TResult>;

export function wrapAWSHandler<TEvent extends APIGatewayProxyEventV2, TResult>(
    wrapOptions: Partial<WrapperOptions> = {},
    handler: OrientHandler,
): OrientHandler<TEvent, TResult | undefined> {
    const START_TIME = moment.now();
    const options: WrapperOptions = {
        flushTimeout: 2000,
        rethrowAfterCapture: true,
        callbackWaitsForEmptyEventLoop: false,
        captureTimeoutWarning: true,
        timeoutWarningLimit: 500,
        captureAllSettledReasons: false,
        initServices: ["hubspot","intercom","sendgrid"],
        ...wrapOptions,
    };
    let timeoutWarningTimer: NodeJS.Timeout;


    return async (event: APIGatewayProxyEventV2, context: OrientContext) => {
        context.callbackWaitsForEmptyEventLoop = options.callbackWaitsForEmptyEventLoop;
        // strigifying event.body to avoid circular json
        event = event ? event : {} as any;
        event.body = event.body ? event.body : JSON.stringify({ ...event })
        console.log("Event body: \n" + JSON.stringify(event.body))

        // Initializing lambda services
        for (const service of options.initServices) {
            context = await initOrientService(service, context, START_TIME);
        }
        // In seconds. You cannot go any more granular than this in AWS Lambda.
        // When `callbackWaitsForEmptyEventLoop` is set to false, which it should when using `captureTimeoutWarning`,
        // we don't have a guarantee that this message will be delivered. Because of that, we don't flush it.
        if (options.captureTimeoutWarning) {
            const timeoutWarningDelay = tryGetRemainingTimeInMillis(context) - options.timeoutWarningLimit;

            timeoutWarningTimer = setTimeout(async () => {
                console.log("received timeout warning");
                await notifySlackChannel(`TIMEOUT:${context.awsRequestId} Lambda ${context.functionName}\n with Event:\n ${JSON.stringify(event.body)}\n`);
                if (context.services.db) {
                    context.services.db.end();
                }
            }, timeoutWarningDelay);
        }

        let result = {}
        try {
            // wrap the handler with sentry error capture
            const wrapped = Sentry.AWSLambda.wrapHandler(handler as Handler, wrapOptions)
            result = await wrapped(event, context, () => { });
          

        } catch (e) {
            await notifySlackChannel(`ERROR: ${context.awsRequestId}\n For lambda name:${context.functionName} with Event:\n ${JSON.stringify(event.body)}\n ${e}\n
            Sentry link: https://sentry.io/organizations/genoox/issues/?project=6160918&query=transaction%3A${context.functionName}&statsPeriod=14d`);

            // captureException(e);
            // if (options.rethrowAfterCapture) {
            //     throw e;
            // }
        } finally {
            clearTimeout(timeoutWarningTimer);
            // await flush(options.flushTimeout);
        }
        return result as TResult;
    };
}
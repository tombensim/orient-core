import { APIGatewayProxyEventV2 } from "aws-lambda";
import * as AWS from 'aws-sdk';
export interface FranklinOrgCreationEventProperties {
    email: string,
    orgId: string,
    orgName: string,
    userFirstName: string,
    userLastName: string,
    userId: string,
    professionalRole: string
}

let secrets: SecretStore;
let secretsLock = false;

export const sleep = async (time: number) => {
    return new Promise(resolve => {
        if (time > 0) {
            console.log(`Sleep for ${time} millis`)
            setTimeout(() => resolve('done'), time)
        } else {
            console.log(`sleep skipped, time: ${time}`)
            resolve("done")
        }
    })
}

export const chunk =
    (size: number, xs: any[]): Array<any[]> =>
        xs.reduce(
            (segments, _, index) =>
                index % size === 0
                    ? [...segments, xs.slice(index, index + size)]
                    : segments,
            []
        );


export const getDateInHubspotFormat = (date: Date) =>
    (() =>

        date.toLocaleDateString("en-US", { year: 'numeric' }) + "-" + date.toLocaleDateString("en-US", { month: '2-digit' }) + "-" + date.toLocaleDateString("en-US", { day: '2-digit' }) // 2019-11-01

    )()

export const parseEvent = (event: APIGatewayProxyEventV2): any => {
    console.log(`Parsing Event, event received:${event.body}`)
    let eventBody: any
    try {
        if (event.body) {
            eventBody = JSON.parse(event.body)
        }
        else {
            throw new Error("Not a valid event body")
        }
    }
    catch (e) {
        throw new Error("Not a valid event body")
    }
    return eventBody;
}

// decodes the html template and replaces the placeholders with the data
export const decodeHTMLEntities = (text: any) => {
    const entities = [
        ['lt', '<'],
        ['gt', '>'],
    ];
    for (let i = 0, max = entities.length; i < max; ++i)
        text = text.replace(new RegExp('&' + entities[i][0] + ';', 'g'), entities[i][1]);

    return text;
}


// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/

// Load the AWS SDK



// In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
// See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
// We rethrow the exception by default.



export interface SecretStore {
    hapikey: string,
    zendesk: string,
    slack_webhook: string,
    bi_data_db: string,
    sendgrid_api_key: string,
    intercom_token: string,
}

export function pgFormatDate(date: any) {
    /* Via http://stackoverflow.com/questions/3605214/javascript-add-leading-zeroes-to-date */
    function zeroPad(d: any) {
        return ("0" + d).slice(-2)
    }

    var parsed = new Date(date)
    return [parsed.getUTCFullYear(), zeroPad(parsed.getMonth() + 1), zeroPad(parsed.getDate())].join("-")
}


export const getSecrets = async (): Promise<SecretStore> => {

    if (secrets || secretsLock) {
        return secrets ? secrets : await new Promise(resolve => {
            do {

            } while (!secrets)
            resolve(secrets);
        })
    }
    console.log('starting gather secrets')
    secretsLock = true;
    return new Promise(res => {
        const region = "eu-west-1",
            secretName = "marketing/services"
        let secret: any,
            decodedBinarySecret;

        // Create a Secrets Manager client
        const client = new AWS.SecretsManager({
            region: region
        });

        client.getSecretValue({ SecretId: secretName }, (err: any, data: any) => {
            if (err) {
                if (err.code === 'DecryptionFailureException')
                    // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InternalServiceErrorException')
                    // An error occurred on the server side.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InvalidParameterException')
                    // You provided an invalid value for a parameter.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'InvalidRequestException')
                    // You provided a parameter value that is not valid for the current state of the resource.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
                else if (err.code === 'ResourceNotFoundException')
                    // We can't find the resource that you asked for.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    throw err;
            }
            else {
                // Decrypts secret using the associated KMS CMK.
                // Depending on whether the secret is a string or binary, one of these fields will be populated.
                if ('SecretString' in data) {
                    secret = data.SecretString;
                } else {
                    const buff = Buffer.from(data.SecretBinary, 'base64');
                    decodedBinarySecret = buff.toString('ascii');
                }
            }
            secretsLock = false;
            secrets = JSON.parse(secret) as SecretStore;
            res(JSON.parse(secret) as SecretStore)


            // Your code goes here. 
        });
    })

}

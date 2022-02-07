//const https = require('https');
import * as SecretsManager from "@aws-sdk/client-secrets-manager";
import { getSecrets, SecretStore } from "../utils";
import { IncomingWebhook } from '@slack/webhook';

const secretsManager = new SecretsManager.SecretsManager({});

export const notifyChannel = async (body: string, slack_webhook?: string) => {

    // for debugging purposes: 
    try {

        console.log('notifying Channel:', JSON.stringify(body, null, 2));

        const secrets = (await getSecrets());
        const url = secrets.slack_webhook
        console.log(`url :${url}`)
        const webhook = new IncomingWebhook(url);

        // Send the notification
        const result = await (async () => {
            await webhook.send({
                text: body,
                channel:"#aws-update-crm"
            });
        })();

        console.log(JSON.stringify(result, null, 2));
        console.log('Done!');
    }
    catch (e) {
        console.log('Error Slack channel notification')
        console.log(e)
    }

}

async function getWebhookPathFromSecretsManager(): Promise<string> {
    /**
     * The secret value in Secrets Manager must be like the one below for Slack Webhooks:
     * https://hooks.slack.com/workflows/XXXXX/XXXX/XXXX/XX
     **/

    console.log('Retrieving Slack webhook path from Secrets Manager...');
    const data: SecretsManager.GetSecretValueCommandOutput =
        await secretsManager.getSecretValue({
            SecretId: process.env.SECRET_STORE_NAME
        })

    const secret = JSON.parse(data.SecretString || "{}") as SecretStore;
    console.log(`secret: ${secret}`)
    return secret.slack_webhook;
}
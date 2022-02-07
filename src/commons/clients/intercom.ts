import * as Intercom from 'intercom-client';
import { BIUser } from '../../lambdas/bi-data/mappers/users_delivery_table';
import { chunk, sleep } from '../utils';
import moment = require('moment');
import { ContactBIData } from './db/controllers/bi-database-controller';

export type UpdateIntercomUsersResult = {
    users_updated: number,
}
export interface IntercomUser {
    email: string,
    custom_attributes: {
        pipeline?: string,
        case_creations?: any,
        searches?: any,
        activation_score?: number,
        professional_role?: string,
        auth0_id?: string,
    }
    tags?: string[]
}

export class IntercomClient {
    client: Intercom.Client;
    intervals: any[];

    constructor(intercomToken: string,) {

        this.client = new Intercom.Client({ token: intercomToken });
    }

    mapBIUsersToIntercom = (users: Array<BIUser & ContactBIData>): IntercomUser[] => users.map((user) => {
        const intercomUser: IntercomUser = {
            email: user.email,
            custom_attributes: {
                case_creations: user.total_samples,
                searches: user.total_searches,
                pipeline:user.deal_pipeline,
                professional_role: user.professional_role,
                auth0_id:user.user_id,
            }
        }
        return intercomUser
    })

    updateIntercomUsers = async (intercomUsers: IntercomUser[], remainingTimeInMillis: number = 60 * 1000): Promise<UpdateIntercomUsersResult> => {

        this.client.useRequestOpts({
            headers: {
                'Intercom-Version': 1.4
            }
        })
        const chunk_size = 150;
        // store the start time of the process in a variable called startTime
        const startTime = moment();
        const chunked = chunk(chunk_size, intercomUsers);
        console.log(`Updating ${intercomUsers.length} users, remaining time: ${remainingTimeInMillis / 1000} seconds`);
        let chunks_counter = 1;
        let total_users_updated = 0;

        for (const userChunk of chunked) {
            const chunk_start_time = new Date();
            console.log(`Updating chunk: ${chunks_counter}/${chunked.length}, chunk_size:${userChunk.length} current time is ${moment(chunk_start_time).format('YYYY-MM-DD HH:mm:ss')}`)
            // every 10 seconds, print the amount of users we have updated so far and the chunk we are currently updating
            let update_start_time = moment()
            try {
                await Promise.all(userChunk.map(user => this.client.users.update(user)));

            }
            catch (e) {
                console.error(`Failed to update chunk: ${chunks_counter}/${chunked.length} with error: ${e}`)
                await sleep(3000)
                update_start_time = moment()
                await Promise.all(userChunk.map(user => this.client.users.update(user)))
                    .then(() => console.log(`success recover for chunk: ${chunks_counter}/${chunked.length}`),
                        (e) => console.error(`Failed to recover chunk: ${chunks_counter}/${chunked.length} with error: ${e}`));
            }

            total_users_updated += userChunk.length;
            chunks_counter++

            if (moment().diff(startTime, 'seconds') + 10 >= remainingTimeInMillis / 1000) {
                // print the amount of users we've updated so far, and the difference between the remaining time and the process start time
                console.log(`Remaining time is ${(remainingTimeInMillis / 1000) - moment().diff(startTime, 'seconds')}(s), updated ${total_users_updated} users so far`)
                console.log(`Will invoke new function, to update ${intercomUsers.length - total_users_updated} additional users`)
                return {
                    users_updated: total_users_updated,
                }
            }
            console.log(`Remaining time is ${(remainingTimeInMillis / 1000) - moment().diff(startTime, 'seconds')}(s), updated ${total_users_updated} users so far`)
            console.log(`Time elapsed: ${moment.duration(moment().diff(startTime)).asSeconds()}(s)`)
            const sleepTime = chunks_counter === chunked.length - 1 ? -1 : 12 * 1000 - moment().diff(update_start_time, 'seconds') * 1000

            await sleep(sleepTime);

            if (chunks_counter % 6 === 0) {
                const sleepTime = 30 * 1000 - moment().diff(update_start_time, 'seconds') * 1000
                console.log(`Sleeping for ${sleepTime / 1000} seconds, updated ${total_users_updated} users}`);
                await sleep(sleepTime);
            }

        }
        console.log(`Intercom: Updated ${intercomUsers.length} users, in ${moment.duration(moment().diff(startTime)).asSeconds()} seconds`);
        return {
            users_updated: total_users_updated,
        }
    }
}
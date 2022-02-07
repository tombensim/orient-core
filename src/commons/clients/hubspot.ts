
import { Client } from '@hubspot/api-client';
import { ForwardPaging, NextPage } from '@hubspot/api-client/lib/codegen/automation/actions/api';
import { PublicAssociationMulti } from '@hubspot/api-client/lib/codegen/crm/associations/api';
import { BatchInputSimplePublicObjectBatchInput, BatchReadInputSimplePublicObjectId, BatchResponseSimplePublicObject, Filter, FilterGroup, SimplePublicObjectInput } from "@hubspot/api-client/lib/codegen/crm/companies/api";
import { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/contacts/api';
import { CollectionResponsePipeline } from '@hubspot/api-client/lib/codegen/crm/pipelines/api';
import { FranklinOrgCreationEventProperties } from '../../lambdas/on-user-registration';
import { chunk, getDateInHubspotFormat } from '../utils';


export enum HSPipelines {
    IMPLEMENTATION = "1134635",
    ACTIVATION = "default",
    CUSTOMER_SUCCESS = "1398126",
    LEAD_QUALIFICATION = "5770222",
    AUTO_PILOT = "17216519",
    CONTRACTING = "17746507",
    EXPECTED_RENEWAL = "1107659",
    ARCHIVED = "1437363",
}
export type HSObjectType = "companies" | "contacts" | "deals"
export class Hubspot {


    private client;
    private pipelines: CollectionResponsePipeline;
    constructor(hapikey: string) {
        this.client = new Client({ apiKey: hapikey })
    }

    LEAD_QUALIFICATION_PIPELINE = "5770222"
    LEAD_QUALIFICATION_NEW_STAGE = "15810992"
    async getHSPipelines(objectType: HSObjectType): Promise<CollectionResponsePipeline> {
        if (!this.pipelines) {
            this.pipelines = (await this.client.crm.pipelines.pipelinesApi.getAll(objectType)).body
        }
        return this.pipelines
    }


    async batchUpdateDeals(deals: SimplePublicObject[] | any[]): Promise<Array<SimplePublicObject>> {

        const chunks: Array<SimplePublicObject[]> = chunk(100, deals);
        const results: Array<Array<SimplePublicObject>> = []
        for (const chunk of chunks) {
            const batchObject: BatchInputSimplePublicObjectBatchInput = {
                inputs: chunk.map(deal => { return { id: deal.id, properties: deal.properties } })
            }
            const result = await this.client.crm.deals.batchApi.update(batchObject)
            results.push(result.body.results)
        }
        return results.flat()
    }

    async batchUpdateContacts(contacts: SimplePublicObject[] | any[]): Promise<Array<SimplePublicObject>> {
        const chunks: Array<SimplePublicObject[]> = chunk(10, contacts);
        const results: Array<Array<SimplePublicObject>> = []
        const seconds = Date.now()
        for (const chunk of chunks) {

            const batchObject: BatchInputSimplePublicObjectBatchInput = {
                inputs: chunk.map(contact => { return { id: contact.id, properties: contact.properties } })
            }
            const result = await this.client.crm.contacts.batchApi.update(batchObject)
            results.push(result.body.results)
        }
        console.log("update contacts took: " + (Date.now() - seconds) + "ms")
        return results.flat()
    }

    async getHSDealsByPipelines(pipelines: string[], deal_properties: string[]): Promise<SimplePublicObject[]> {

        const hsDeals: SimplePublicObject[] = []
        const chunks = chunk(3, pipelines);

        for (const chunk of chunks) {
            const filterGroups = chunk.map((pipeline: string) => {

                return {
                    filters: [{
                        "propertyName": "pipeline",
                        "operator": Filter.OperatorEnum.EQ,
                        "value": pipeline
                    }]
                }
            })
            let paging: ForwardPaging | undefined;
            let after: NextPage | undefined;

            do {
                console.log(`Get all pipeline (count 1: ${after ? Number.parseInt(after.after) : 0})`);
                const deals = await this.client.crm.deals.searchApi
                    .doSearch({ filterGroups: filterGroups, properties: deal_properties, after: after ? Number.parseInt(after.after) : 0, limit: 100, sorts: [] })

                hsDeals.push(...deals.body.results)
                paging = deals.body.paging
                after = paging?.next

            } while (paging)
        }
        return hsDeals;
    }

    async searchContactByEmail(email: string, returnedProperties?: Array<string>) {
        const filter: Filter = { propertyName: 'email', operator: Filter.OperatorEnum.EQ, value: email }
        const filterGroup: FilterGroup = { filters: [filter] }
        const sort = JSON.stringify({ propertyName: 'createdate', direction: 'DESCENDING' })
        const query = ''
        const properties = returnedProperties ? returnedProperties : ['createdate', 'firstname', 'lastname', 'auth0_id', "email"]
        const limit = 100
        const after = 0
        const publicObjectSearchRequest = {
            filterGroups: [filterGroup],
            sorts: [sort],
            query,
            properties,
            limit,
            after,
        }

        const result = await this.client.crm.contacts.searchApi.doSearch(publicObjectSearchRequest)
        return result.body
    }



    async searchDealByFranklinOrganiationId(franklin_organization_id: string) {
        const filter: Filter = { propertyName: 'franklin_organization_id', operator: Filter.OperatorEnum.EQ, value: franklin_organization_id }
        const filterGroup: FilterGroup = { filters: [filter] }
        const sort = JSON.stringify({ propertyName: 'createdate', direction: 'DESCENDING' })
        const query = ''
        const properties = ['createdate', 'dealstage', 'pipeline', "dealname"]
        const limit = 100
        const after = 0
        const publicObjectSearchRequest = {
            filterGroups: [filterGroup],
            sorts: [sort],
            query,
            properties,
            limit,
            after,
        }

        const result = await this.client.crm.deals.searchApi.doSearch(publicObjectSearchRequest)
        return result.body
    }


    async getAllPipelineContacts(returnedProperties: Array<string>): Promise<SimplePublicObject[]> {
        console.log("START: getAllPipelineContacts, properties:\n " + returnedProperties)
        const contacts = []
        const filter: Filter = {
            "propertyName": "deal_pipeline",
            "operator": Filter.OperatorEnum.HASPROPERTY,
        }
        const filterGroup: FilterGroup = { filters: [filter] }
        const query = ''
        let paging: ForwardPaging | undefined;
        let after: NextPage | undefined;
        const properties = returnedProperties
        const sort = JSON.stringify({ propertyName: 'createdate', direction: 'DESCENDING' })
        const limit = 100
        do {
            // print log only when after is divisable by 1000 
            if (after && Number.parseInt(after.after) % 1000 == 0) {
                console.log(`Get all contact  (count : ${after ? Number.parseInt(after.after) : 0})`);
            }
            const publicObjectSearchRequest = {
                filterGroups: [filterGroup],
                sorts: [sort],
                query,
                properties,
                limit,
                after: after ? Number.parseInt(after.after) : 0,
            }
            const deals = await this.client.crm.contacts.searchApi
                .doSearch(publicObjectSearchRequest)

            contacts.push(...deals.body.results)
            paging = deals.body.paging
            after = paging?.next

        } while (paging)
        return contacts;

    }


    // async getAllPipelineContacts() {
    //     const filter: Filter = { propertyName: 'deal_pipeline', operator: Filter.OperatorEnum.HASPROPERTY }
    //     const filterGroup: FilterGroup = { filters: [filter] }
    //     const sort = JSON.stringify({ propertyName: 'createdate', direction: 'DESCENDING' })
    //     const query = ''
    //     const properties = ['createdate', 'deal_pipeline', "email"]
    //     const limit = 100
    //     const after = 0
    //     const publicObjectSearchRequest = {
    //         filterGroups: [filterGroup],
    //         sorts: [sort],
    //         query,
    //         properties,
    //         limit,
    //         after,
    //     }


    //     const result = await this.client.crm.contacts.searchApi.doSearch(publicObjectSearchRequest)
    //     return result.body
    // }


    // async createContact(email: string, auth0_id: string, firstname:string, lastname:string) {
    //     const result = await this.client.crm.contacts.basicApi.create({ properties: { email, auth0_id, firstname, lastname, hs_lead_status: "OPEN" } })
    //     return result.body;
    // }
    async createContact(properties: SimplePublicObjectInput) {
        const result = await this.client.crm.contacts.basicApi.create(properties)
        return result.body;
    }

    async updateContact(contact: SimplePublicObject, properties: SimplePublicObjectInput) {
        const result = await this.client.crm.contacts.basicApi.update(contact.id, properties)
    }

    async getContactDealAssociations(contact: SimplePublicObject) {
        const results = await this.client.crm.associations.batchApi.read('contacts', 'deals', { inputs: [{ id: contact.id }] })
        return results.body;
    }

    async getDealsCompanyAssociation(deals: SimplePublicObject[]) {
        const chunks = chunk(100, deals)
        const results: Array<Array<PublicAssociationMulti>> =
            await Promise.all(chunks.map(async (chunk: SimplePublicObject[]) => {
                const res = await this.client.crm.associations.batchApi.read('deals', 'company', {
                    inputs: chunk.map(deal => { return { id: deal.id } })
                })
                return res.body.results
            }))

        return results.reduce((acc, cur) => cur.concat(acc), []);
    }

    async createHSDeal(name: string, franklin_organization_id: string) {
        const body = {
            properties: {
                dealname: name,
                franklin_organization_id,
                pipeline: this.LEAD_QUALIFICATION_PIPELINE,
                dealstage: this.LEAD_QUALIFICATION_NEW_STAGE,
                plan: "Community",
                source: "Freemium",
                contract_payment_type: "Community (Free)",
                subscription_status: "Not Started"
            }
        }
        const result = await this.client.crm.deals.basicApi.create(body)
        return result.body
    }

    async assosicateContactWithDeal(contact: SimplePublicObject, deal: SimplePublicObject) {
        const result = await this.client.crm.contacts.associationsApi.create(contact.id, "deals", deal.id, "contact_to_deal")
        return result.body
    }

    async getCompaniesProperties(companies: string[], properties: string[]): Promise<Array<SimplePublicObject>> {

        const chunks = chunk(100, companies)
        const results: Array<Array<SimplePublicObject>> = await Promise.all(chunks.map(async (chunk: string[]) => {
            const batchRead: BatchReadInputSimplePublicObjectId = {
                inputs: chunk.map(company => { return { id: company } }),
                properties: properties

            }
            const result = await this.client.crm.companies.batchApi.read(batchRead)
            return result.body.results
        })
        )
        return results.reduce((acc, cur) => cur.concat(acc), []);
    }


}


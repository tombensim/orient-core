import moment = require("moment")
import { CaseRequestEventProperties, CaseRequestEventPropertiesRow } from "../../../../lambdas/community-manager/on-case-request"
import { PublisherRequestEventProps, PublisherRequestEventPropsRow } from "../../../../lambdas/community-manager/on-post-request"
import { createTableIfNotExist } from "../db-client"

const dummyCase: CaseRequestEventPropertiesRow = {
    queryUserEmail: "tom@genoox.com",
    queryUserOrg: "Alberta Children's Hospital#2",
    subjectVariant: "chr12:14798204:C>T",
    contextVariant: "chr12:14798204:C>T",
    similarVariant: false,
    variantCaseOwners: "ege_univer_1_448",
    sampleNames: "yusuf_em_r_227",
    contactUsers: "tahiratik@yahoo.com",
    caseNames: "ege_univer_1_448: YUSUF EMİR GÜVEN",
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    queryUserCommunity: "NONE",
    samplesFilter: '',
    timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
    approval: 'To Do',
    requestUuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
}


const dummyPost: PublisherRequestEventPropsRow = {
    authorEmail: "",
    authorName: "",
    authorOrg: "",
    contextVariant: "",
    postId: "",
    queryUserEmail: "",
    queryUserOrg: "", 
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',


}

export const COMMUNITY_TABLES_SCHEME_NAME = "community"
export const CASE_REQUESTS_TABLE_NAME = "case_requests"
export type COMMUNITY_TABLES = "case_requests" | "post_requests"

export const createCommunityTableIfNotExist = async (tableName: COMMUNITY_TABLES = "case_requests") =>
    await createTableIfNotExist(
        COMMUNITY_TABLES_SCHEME_NAME,
        tableName,
        tableName !== "case_requests" ? dummyPost : dummyCase,
        'uuid',
        true
    )


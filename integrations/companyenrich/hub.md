# CompanyEnrich

Connect Botpress agents to CompanyEnrich for company and people enrichment, account discovery, and lookalike research.

## Setup

1. Sign in to the [CompanyEnrich dashboard](https://app.companyenrich.com/) and obtain an API key.
2. Install this integration and enter the key without the `Bearer` prefix.
3. Save the configuration. The integration validates the key with the free `GET /me` endpoint and discards its response.

## Core actions

| Action                       | Capability                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Enrich Company               | Retrieve a full company profile by domain, with optional workforce expansion and `waitForEnrichment`.                                         |
| Search Companies             | Discover companies with literal and semantic queries, structured filters, and optional workforce expansion.                                   |
| Find Similar Companies       | Discover lookalikes from one to ten seed domains with filters, workforce expansion, and `waitForEnrichment`.                                  |
| Search People                | Search people with name, role, company, location, seniority, department, and education filters.                                               |
| Lookup Person by Email       | Retrieve the person and company associated with an email, with optional education expansion.                                                  |
| Get Company Workforce        | Retrieve workforce data using exactly one company UUID or domain.                                                                             |
| Enrich Company by Properties | Match by at least one documented property: `name`, `linkedinUrl`, `linkedinId`, `twitterUrl`, `facebookUrl`, `instagramUrl`, or `youTubeUrl`. |
| Batch Enrich Companies       | Enrich one to fifty domains in a single request, with optional workforce expansion.                                                           |
| Get Company by ID            | Retrieve a company by UUID, with optional workforce expansion.                                                                                |
| Get Person by ID             | Retrieve a person using a positive decimal int64 ID string, with optional education expansion.                                                |
| Count Matching Companies     | Count companies matching a literal/semantic search and filters.                                                                               |
| Count Similar Companies      | Count lookalikes for one to ten seed domains and filters.                                                                                     |

The original `enrichCompany`, `searchCompanies`, and `findSimilarCompanies` action names and output envelopes remain unchanged. **Search Companies' existing `query` field remains a semantic description.** `semanticQuery` overrides it when supplied; `literalQuery` is a separate literal search. Optional `filters` objects preserve all documented API body fields and future fields. Dedicated action fields take precedence, including the default page 1 and page size 10. For complete control of body pagination, use the advanced action.

For example, Search Companies can combine `literalQuery: "software"` with filters `{ "countries": ["US"], "technologies": ["React"], "exclude": { "domains": ["example.com"] } }`. Search People accepts nested filters such as `{ "companyFilter": { "domains": ["example.com"] }, "positionQuery": ["engineer"] }`.

Responses retain all fields, pagination metadata, similarity scores, and future nested data. Existing enrichment returns `{ company }`; existing search and lookalike actions return `{ result }`. New core actions return `{ result }`, preserving numeric counts (including zero) and batch arrays.

## Advanced operation

**Advanced CompanyEnrich Operation** exposes 42 documented operations through a fixed `operation` selector. It accepts optional JSON objects for `body`, `query`, and `path_parameters`. Methods and URLs are fixed internally; arbitrary URLs, account details, saved-list administration, and custom headers are not exposed.

Use the operation table below with the [API reference](https://docs.companyenrich.com/reference) for full request fields. For example, `post_companies_search_scroll` accepts `{ "cursor": "…", "pageSize": 10 }` in `body`; `get_jobs_jobid` accepts `{ "jobId": "your-job-uuid" }` in `path_parameters`.

Email lookup, bulk email creation, and bulk email status are **Beta** and require `allow_beta: true` on each invocation; the default is false. Person IDs can be decimal strings to preserve int64 precision. Bulk email `items[].person_id` decimal strings are sent as exact JSON integer tokens.

The advanced action returns `{ data }` containing the entire API response. Every invocation makes one request. Scroll cursors, job IDs, and result URLs are returned to the workflow: there is no automatic pagination, polling, download, or retry. Export jobs require an explicit `count` from 1 to 50,000; bulk company enrichment requires 1–10,000 domains, and bulk email jobs require 1–1,000 items. These limits avoid accidentally creating an unbounded job.

| Operation                              | Request                               |
| -------------------------------------- | ------------------------------------- |
| `get_companies_enrich`                 | `GET /companies/enrich`               |
| `post_companies_enrich`                | `POST /companies/enrich`              |
| `post_companies_enrich_batch`          | `POST /companies/enrich/batch`        |
| `get_companies_workforce`              | `GET /companies/workforce`            |
| `get_companies_autocomplete`           | `GET /companies/autocomplete`         |
| `post_companies_enrich_bulk`           | `POST /companies/enrich/bulk`         |
| `get_companies_enrich_bulk_jobid`      | `GET /companies/enrich/bulk/{jobId}`  |
| `get_companies_enrich_bulk_jobs`       | `GET /companies/enrich/bulk/jobs`     |
| `post_companies_search`                | `POST /companies/search`              |
| `post_companies_search_preview`        | `POST /companies/search/preview`      |
| `post_companies_search_count`          | `POST /companies/search/count`        |
| `post_companies_search_scroll`         | `POST /companies/search/scroll`       |
| `get_companies`                        | `GET /companies`                      |
| `post_companies_search_async`          | `POST /companies/search/async`        |
| `get_companies_search_async_jobid`     | `GET /companies/search/async/{jobId}` |
| `get_companies_search_async_jobs`      | `GET /companies/search/async/jobs`    |
| `post_companies_similar`               | `POST /companies/similar`             |
| `post_companies_similar_preview`       | `POST /companies/similar/preview`     |
| `post_companies_similar_count`         | `POST /companies/similar/count`       |
| `post_companies_similar_scroll`        | `POST /companies/similar/scroll`      |
| `post_people_lookup`                   | `POST /people/lookup`                 |
| `get_people`                           | `GET /people`                         |
| `post_people_search`                   | `POST /people/search`                 |
| `post_people_search_scroll`            | `POST /people/search/scroll`          |
| `get_people_email` **Beta**            | `GET /people/email`                   |
| `post_people_email_bulk` **Beta**      | `POST /people/email/bulk`             |
| `get_people_email_bulk_jobid` **Beta** | `GET /people/email/bulk/{jobId}`      |
| `get_people_education`                 | `GET /people/education`               |
| `post_people_search_async`             | `POST /people/search/async`           |
| `get_people_search_async_jobid`        | `GET /people/search/async/{jobId}`    |
| `get_people_search_async_jobs`         | `GET /people/search/async/jobs`       |
| `get_jobs`                             | `GET /jobs`                           |
| `get_jobs_jobid`                       | `GET /jobs/{jobId}`                   |
| `get_geo_regions`                      | `GET /geo/regions`                    |
| `get_geo_countries_countrycode`        | `GET /geo/countries/{countryCode}`    |
| `post_geo_countries`                   | `POST /geo/countries`                 |
| `post_geo_states`                      | `POST /geo/states`                    |
| `post_geo_cities`                      | `POST /geo/cities`                    |
| `get_industries`                       | `GET /industries`                     |
| `get_keywords_autocomplete`            | `GET /keywords/autocomplete`          |
| `get_technologies_autocomplete`        | `GET /technologies/autocomplete`      |
| `get_positions_autocomplete`           | `GET /positions/autocomplete`         |

## Request limits and credits

Page-based requests default to page 1 and page size 10 in both core and advanced actions; cursor requests default to page size 10. Page size must be 1–100, and page × page size must not exceed 10,000. Literal company/person queries are limited to 250 characters and semantic company descriptions to 500. Basic shape, required fields, identifiers, bounds, and expansion values are checked before requesting; CompanyEnrich remains authoritative for evolving filter semantics and taxonomy membership.

Data requests and optional expansions can consume CompanyEnrich credits. A 404 enrichment response can indicate a missing company or pending background enrichment; it is surfaced as an error. Requests time out after 30 seconds, redirects are disabled, and errors omit upstream response bodies and credentials. Failed paid requests are not automatically retried.

See the [API reference](https://docs.companyenrich.com/reference) and [credit guide](https://docs.companyenrich.com/docs/credits). The integration's allowlist and basic validation constraints reflect the public OpenAPI documentation reviewed on October 31, 2026. Tests use mocked requests; authenticated data execution is not part of the test suite.

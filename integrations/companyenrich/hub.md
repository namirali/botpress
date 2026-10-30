# CompanyEnrich

Connect Botpress agents to CompanyEnrich for company enrichment, account discovery, and lookalike research.

## Setup

1. Sign in to the [CompanyEnrich dashboard](https://app.companyenrich.com/) and obtain an API key.
2. Install this integration and enter the key without the `Bearer` prefix.
3. Save the configuration. The integration validates the key with `GET /me`, which does not consume credits.

## Actions

- **Enrich Company**: look up a domain such as `stripe.com` and return the company profile.
- **Search Companies**: use a natural-language description to discover matching companies.
- **Find Similar Companies**: supply one to ten seed domains to discover lookalikes.

Search actions return the original API response, including pagination metadata. Each action makes one request; choose the page and page size explicitly. The default page size is 10, the maximum is 100, and page × page size cannot exceed 10,000.

Data requests can consume CompanyEnrich credits. A 404 enrichment response can indicate a missing company or pending background enrichment; it is surfaced as an error. Failed requests are not automatically retried.

See the [API reference](https://docs.companyenrich.com/reference) and [credit guide](https://docs.companyenrich.com/docs/credits).

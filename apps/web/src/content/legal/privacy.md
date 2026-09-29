# Privacy Policy

_Effective date: {{date}}_

> **Draft template.** This document was prepared before launch and has not yet been reviewed by a lawyer. Items marked **[TO CONFIRM: …]** need a business or legal decision.

This Privacy Policy explains how {{company.legalName}} ("we", "us", "{{brand}}") collects, uses and shares personal data when you visit our website, create an account or use our API (the "Service"). It is written to meet the information requirements of the EU and UK GDPR, the California Consumer Privacy Act (CCPA/CPRA), the Hong Kong Personal Data (Privacy) Ordinance (PDPO), Brazil's LGPD, Japan's APPI and other laws. Sections 14–19 contain additional information for specific regions.


## 1. Summary

- We collect what we need to run your account, bill your requests and keep the Service secure.
- **By default we do not store the content of your prompts or responses.** We store request metadata only. Content is stored only if you turn on logging.
- To generate a response, **we send your prompt to the model provider you choose** (for example OpenAI, Anthropic, Google, DeepSeek or Alibaba Cloud). Some of them are in the US and China.
- We do not sell your personal data and we do not use it for cross-context behavioural advertising.
- We do not use your prompts or responses to train models.

## 2. Who is responsible for your data

The controller of your personal data is:

{{company.legalName}}, a private company limited by shares incorporated in Hong Kong
Company registration number: {{company.crNumber}}
Address: {{company.address}}
Privacy contact: {{company.privacyEmail}}

**EU representative (GDPR Art. 27):** {{company.euRep}}
**UK representative (UK GDPR Art. 27):** {{company.ukRep}}

You can contact our representatives instead of us about any data protection matter.

**[TO CONFIRM: whether we must appoint a Data Protection Officer under GDPR Art. 37 (likely not required, but review once processing volumes are known).]**

### When we act for you instead

If you send personal data of other people through the API (for example, your own customers' messages), we process that data **on your behalf** as a processor, and you are the controller. This Privacy Policy does not cover that processing; your own privacy notice does. **[TO CONFIRM: publish a Data Processing Addendum.]**

## 3. What data we collect

### 3.1 Data you give us

| Category | Examples | Required? |
|---|---|---|
| Account data | Name, email address, password (stored only as a salted hash) | Email and password are required to sign up with email. Name is optional **[TO CONFIRM]** |
| OAuth profile | If you sign in with Google: name, email address, profile picture (avatar), provider account ID | Required only if you choose that sign-in method |
| Billing data | Top-up amounts, currency, payment status, transaction IDs, invoice details for companies (company name, address, tax ID) | Required to top up. Card data is collected directly by [PAYMENT PROCESSOR], not by us |
| Support messages | What you write to us and our replies | Voluntary |

### 3.2 Data we collect when you use the Service

| Category | Examples |
|---|---|
| Request metadata | Model used, number of input and output tokens, cost, timestamps, API key ID, IP address, response status |
| Technical data | IP address, user agent (browser and device type), session data, security logs |
| Settings and preferences | Language, display currency, API key names and spending limits, logging on/off, cookie choices |
| Request content (only if logging is on) | Prompts, files and parameters you send, and the responses you receive |

### 3.3 Data from others

- Google, when you use them to sign in (see 3.1).
- [PAYMENT PROCESSOR], which tells us whether a payment succeeded, the card brand, the last four digits and the country of the card, and fraud-risk signals **[TO CONFIRM: exact fields returned by the processor]**.

### 3.4 Data we do not want

Please do not send us special categories of personal data (such as health, biometric data or data about religion) in prompts unless you have a lawful basis and it is necessary. If you turn on logging, such data may end up stored.

## 4. Why we use your data and our legal bases

| Purpose | Data used | Legal basis (EU/UK GDPR) |
|---|---|---|
| Create and manage your account, authenticate you | Account data, OAuth profile, technical data | Performance of a contract (Art. 6(1)(b)) |
| Forward your requests to the model provider and return responses | Request content (in transit), metadata | Performance of a contract |
| Charge your balance, handle top-ups, invoices and refunds | Billing data, metadata | Performance of a contract |
| Keep accounting and tax records | Billing data | Legal obligation (Art. 6(1)(c)) |
| Store request logs, if you turn logging on | Request content | Performance of a contract, at your request. **[TO CONFIRM: or consent (Art. 6(1)(a))]** |
| Show your usage and spending in the dashboard | Metadata | Performance of a contract |
| Prevent fraud, abuse, and payment fraud; enforce our Terms and model providers' policies; secure the Service | Technical data, metadata, billing data | Legitimate interests (Art. 6(1)(f)) in protecting our Service and users |
| Screen for sanctions compliance | Account data, IP address, billing country | Legal obligation where applicable; otherwise legitimate interests |
| Answer support requests | Support messages, account data | Performance of a contract or legitimate interests |
| Send service emails (receipts, security alerts, changes to terms) | Email address | Performance of a contract; legal obligation |
| Send product news or offers **[TO CONFIRM: whether we will send marketing emails]** | Email address | Consent, or legitimate interests for existing customers where the law allows; you can opt out at any time |
| Remember your language, currency and cookie choices | Cookie data | Necessary for the service you request; see the [Cookie Policy](/legal/cookies) |
| Establish, exercise or defend legal claims | Relevant records | Legitimate interests |

Where we rely on legitimate interests, you can ask us for details of the balancing test.

### Is providing data required?

You need to give us an email address (or use Google) and payment details to use the paid Service; without them we cannot create your account or process payments. Request metadata is collected automatically because we need it to bill you. Everything else, such as your name, support messages and enabling logging, is voluntary.

### Automated decision-making

We do not make decisions that produce legal or similarly significant effects about you based solely on automated processing. We use automated fraud and abuse signals (for example, to flag suspicious sign-ups or payments), but a person reviews any decision to close an account. **[TO CONFIRM: that human review is actually in place; the payment processor may make its own automated decisions to decline payments.]**

## 5. Who we share data with

We share personal data only as described here:

- **Model providers.** When you send a request, the content of that request (prompts, files, parameters) is transmitted to the provider of the model you choose: OpenAI, Anthropic, Google, DeepSeek or Alibaba Cloud. They process it to generate the response and may retain it for a limited time under their own terms, for example for abuse monitoring. We do not send them your account data such as your name or email. **[TO CONFIRM: whether any user identifier is passed to providers for abuse monitoring.]**
- **Service providers (subprocessors)** who host our infrastructure, process payments and send emails on our behalf: [HOSTING PROVIDER], [PAYMENT PROCESSOR], [EMAIL PROVIDER].
- **Sign-in providers.** Google, when you choose to sign in with them.
- **Professional advisers** such as lawyers, auditors and accountants.
- **Authorities**, where we are legally required to, or to protect our rights, users or the public.
- **A buyer or successor**, if we reorganise or sell our business. We will tell you before your data becomes subject to a different privacy policy.

The full, current list of subprocessors and their locations is on our [Subprocessors](/legal/subprocessors) page.

## 6. International transfers

We are based in Hong Kong, and our service providers and model providers operate in other countries. Your data may be transferred to:

| Country | Why |
|---|---|
| Hong Kong | Our company |
| United States | OpenAI, Anthropic, Google; possibly hosting, payment and email providers |
| China | DeepSeek; Alibaba Cloud **[TO CONFIRM]** |
| Singapore | Alibaba Cloud (international) **[TO CONFIRM]** |
| [OTHER COUNTRIES] | [HOSTING PROVIDER] data centres **[TO CONFIRM]** |

Not all of these countries have been found by the European Commission or the UK government to provide an adequate level of data protection. Where data from the EU/EEA or UK goes to such a country, we use:

- the EU **Standard Contractual Clauses** (Commission Decision 2021/914) and, for UK data, the UK International Data Transfer Addendum; or
- the EU-US Data Privacy Framework, where the US recipient is certified; or
- where no other mechanism is available and you ask us to route your request to a particular model, the transfer is necessary to perform our contract with you (GDPR Art. 49(1)(b)).

**[TO CONFIRM: which mechanism applies to each model provider; transfer impact assessments, in particular for transfers to China (DeepSeek, Alibaba Cloud); whether to show a warning in the dashboard before a user first selects a model hosted in China.]**

You can ask for a copy of the safeguards we use by writing to {{company.privacyEmail}}.

## 7. How long we keep data

| Data | Retention |
|---|---|
| Account data and OAuth profile | While your account is open, then deleted within **[TO CONFIRM: 30 days]** of closure, except as below |
| Request metadata | **[TO CONFIRM: e.g. 24 months]** for billing, support and dispute handling |
| Request content (logging on) | Until you delete it or turn logging off, and at most **[TO CONFIRM: e.g. 30 days]** |
| Request content (logging off) | Not stored. Held in memory only while the request is processed |
| Billing and accounting records | 7 years after the end of the financial year, as required by Hong Kong tax and company law **[TO CONFIRM]** |
| Security and access logs (IP, user agent) | **[TO CONFIRM: e.g. 90 days]**, longer if needed to investigate an incident |
| Support messages | **[TO CONFIRM: e.g. 2 years]** after the conversation ends |
| Cookie consent record | 6 months, then we ask again |

Model providers keep data they receive according to their own retention policies. See the [Subprocessors](/legal/subprocessors) page.

## 8. How we protect data

We use encryption in transit (TLS), hashed passwords, access controls limited to staff who need access, and logging of administrative access. API keys are shown in full only once and stored in hashed form **[TO CONFIRM]**. No system is perfectly secure; if a breach affects your data, we will notify you and the authorities where the law requires.

## 9. Your rights

Depending on where you live, you may have the right to:

- **access** your personal data and get a copy;
- **correct** inaccurate data;
- **delete** your data;
- **restrict** or **object to** our processing, including processing based on legitimate interests and any direct marketing;
- **data portability**: receive your data in a machine-readable format;
- **withdraw consent** at any time, where we rely on consent, without affecting earlier processing;
- **not be discriminated against** for exercising your rights.

Most account data can be viewed, changed or exported in your dashboard, and you can delete your account there. **[TO CONFIRM: self-service export and deletion are available at launch.]** For anything else, email {{company.privacyEmail}}. We will reply within one month (GDPR), 40 days (PDPO) or 45 days (CCPA), whichever applies, and may ask you to verify your identity. We may extend these periods where the law allows and will tell you if we do.

### Complaints

If you are unhappy with how we handle your data, please contact us first at {{company.privacyEmail}}. We will acknowledge your complaint **within 30 days**, investigate it without undue delay and tell you the outcome.

You also have the right to complain to a supervisory authority, in particular in the country where you live or work, or where you think an infringement took place. For example:

- EU/EEA: your national data protection authority (list at edpb.europa.eu);
- UK: the Information Commissioner's Office (ico.org.uk);
- Hong Kong: the Office of the Privacy Commissioner for Personal Data (pcpd.org.hk);
- California: the California Privacy Protection Agency (cppa.ca.gov);
- Brazil: the Autoridade Nacional de Proteção de Dados (ANPD).

## 10. Cookies

We use only strictly necessary cookies at the moment. Details are in our [Cookie Policy](/legal/cookies). We honour the Global Privacy Control (GPC) signal.

## 11. Children

The Service is for people aged 18 and over. We do not knowingly collect data from children. If you believe a child has created an account, contact {{company.privacyEmail}} and we will delete it.

## 12. Changes to this policy

We will post any changes on this page with a new effective date. If the changes are significant, we will also tell you by email or in the dashboard before they take effect.

## 13. Contact

Privacy questions and requests: {{company.privacyEmail}}
Postal address: {{company.legalName}}, {{company.address}}
EU representative: {{company.euRep}}
UK representative: {{company.ukRep}}

## 14. United Kingdom

This section applies in addition to the rest of this policy. Under the Data (Use and Access) Act 2025, you can complain to us about how we use your personal data. We will acknowledge your complaint within 30 days of receiving it, take appropriate steps to respond to it without undue delay (including making enquiries), and tell you the outcome. If you are not satisfied, you can complain to the ICO.

## 15. California (CCPA/CPRA)

**[TO CONFIRM: whether we meet CCPA applicability thresholds. The notice below is provided in any case.]**

### Notice at collection

In the last 12 months we collected the following categories of personal information, for the purposes described in section 4, and kept them for the periods in section 7:

| CCPA category | Examples | Disclosed for a business purpose to |
|---|---|---|
| Identifiers | Name, email, IP address, account ID, API key ID | Hosting, email providers; sign-in providers |
| Customer records (Cal. Civ. Code § 1798.80(e)) | Name, billing records | Payment processor |
| Commercial information | Top-ups, balance, purchase history | Payment processor |
| Internet or other electronic network activity | Request metadata, user agent, security logs | Hosting provider |
| Geolocation data (approximate, from IP) | Country or region | Hosting provider |
| Sensitive personal information | Account login (email and password) | Not disclosed except to hosting provider; used only to provide the Service |
| Content of communications (only if you enable logging or contact support) | Prompts, responses, support messages | Model providers (prompts, to generate responses); hosting provider |

We collect this information from you, from your device, and from sign-in and payment providers (section 3).

### We do not sell or share personal information

We do **not sell** personal information and do **not share** it for cross-context behavioural advertising, and have not done so in the last 12 months. We do not knowingly sell or share personal information of consumers under 16. We use sensitive personal information only for purposes permitted by the CCPA regulations, so we do not offer a "limit" option.

### Your California rights

You have the right to know, access, delete and correct your personal information, and to opt out of sale and sharing (which we do not do). You can exercise them by emailing {{company.privacyEmail}}. You can use an authorised agent; we may ask for proof of the agent's authority and verify your identity. We will not discriminate against you for exercising your rights.

**Global Privacy Control.** We treat a GPC signal as a valid request to opt out of sale and sharing, and we also use it to keep optional (analytics and marketing) cookies off.

## 16. Hong Kong: Personal Information Collection Statement (PICS)

This statement is made under the Personal Data (Privacy) Ordinance (Cap. 486).

1. **Purposes of collection.** We collect your personal data for the purposes in section 4: providing and billing the Service, account security, fraud prevention, customer support, compliance with legal and regulatory obligations, and (only if you agree) marketing.
2. **Obligatory or voluntary.** Your email address (or Google sign-in) and payment information are obligatory. If you do not provide them, we cannot open an account or process top-ups. Other data (for example, your name and support messages) is voluntary.
3. **Classes of transferees.** Your data may be transferred to: model providers (request content only); hosting, payment and email service providers; sign-in providers; professional advisers; law enforcement and regulators where required by law; and a successor to our business. Some transferees are outside Hong Kong (section 6).
4. **Direct marketing.** We will not use your personal data in direct marketing without your consent. **[TO CONFIRM]**
5. **Access and correction.** You have the right to request access to and correction of your personal data. Send data access and correction requests to our privacy officer at {{company.privacyEmail}} or by post to {{company.address}}. We may charge a fee that is not excessive for complying with a data access request.

## 17. Brazil (LGPD)

In line with Article 9 of the LGPD:

- **Controller:** {{company.legalName}} (section 2).
- **Purpose, form and duration of processing:** sections 4 and 7.
- **Shared use of data and recipients:** sections 5 and 6.
- **International transfers** are made under the mechanisms in Article 33 of the LGPD, including standard contractual clauses approved by the ANPD where applicable **[TO CONFIRM]**.
- **Your rights under Article 18:** confirmation of processing, access, correction, anonymisation, blocking or deletion, portability, information about sharing, and withdrawal of consent. Send requests to the Encarregado.
- **Encarregado (Data Protection Officer):** [ENCARREGADO NAME], {{company.privacyEmail}}. **[TO CONFIRM]**

## 18. Japan (APPI)

- **Purpose of use.** We use personal information only for the purposes in section 4.
- **Provision to third parties in foreign countries.** When you choose a model, your request content is provided to that model provider in the country listed in section 6 (the United States, China or Singapore). By using a model you consent to this provision **[TO CONFIRM: consent mechanism, e.g. checkbox at sign-up for users in Japan]**. Information on the personal data protection systems of those countries is published by the Personal Information Protection Commission of Japan (ppc.go.jp). The measures taken by the recipients to protect personal information are described in their privacy policies and our agreements with them **[TO CONFIRM: summary per provider]**.
- **Security control measures** are summarised in section 8.
- **Requests** for disclosure, correction, suspension of use or deletion can be sent to {{company.privacyEmail}}.

## 19. Other regions

- **Mainland China (PIPL).** The Service is not directed at individuals in mainland China, and we do not intend to process personal data of individuals located there.
- **Other countries.** If local law gives you additional rights, contact {{company.privacyEmail}} and we will respond according to that law.

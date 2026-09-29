# Terms of Service

_Effective date: {{date}}_

> **Draft template.** This document was prepared before launch and has not yet been reviewed by a lawyer. Items marked **[TO CONFIRM: …]** need a business or legal decision.

These Terms of Service ("Terms") are a contract between you and {{company.legalName}}, a private company limited by shares incorporated in Hong Kong (company registration number {{company.crNumber}}, business registration number {{company.brNumber}}, registered address {{company.address}}) ("we", "us", "{{brand}}"). They govern your use of the {{brand}} website, dashboard and API (together, the "Service").

Please read them together with our [Privacy Policy](/legal/privacy), [Acceptable Use Policy](/legal/acceptable-use), [Refund Policy](/legal/refunds) and [Cookie Policy](/legal/cookies). By creating an account or using the Service you agree to these Terms. If you do not agree, do not use the Service.

## 1. What the Service is

{{brand}} is an AI API gateway. With one OpenAI-compatible API key you can send requests to AI models operated by third-party providers, including OpenAI, Anthropic, Google, DeepSeek and Alibaba Cloud (Qwen) ("Model Providers").

When you send a request, we forward its content (prompts, files and parameters) to the Model Provider that operates the model you chose. The Model Provider generates the response, and we return it to you. We charge your prepaid balance for each request based on the number of tokens processed and the listed price of the model.

We do not build or train these models. We do not control how they behave, what they produce, or whether a Model Provider keeps a model available.

## 2. Who can use the Service

- You must be at least **18 years old** and able to enter into a binding contract.
- If you use the Service on behalf of a company or other organisation, you confirm that you are authorised to accept these Terms for it. In that case "you" also means that organisation.
- You may not use the Service if you are located in, ordinarily resident in, or organised under the laws of a sanctioned jurisdiction, or if you are a sanctioned person (see section 12).
- The Service is not directed at users in mainland China. **[TO CONFIRM: list of countries where the Service is not offered, taking into account Model Providers' own lists of supported countries and regions.]**

## 3. Consumers and business users

Some parts of these Terms apply differently depending on whether you are a consumer or a business user.

- A **consumer** is an individual using the Service mainly for purposes outside their trade, business, craft or profession.
- A **business user** is anyone else, including individuals acting for their business and any organisation that receives invoices from us.

If you are a consumer, nothing in these Terms limits the rights you have under the mandatory consumer protection laws of the country where you live. Where these Terms say something different from those laws, the laws prevail.

## 4. Your account

### 4.1 Creating an account

You can sign up with an email address and password, or with Google. You must give us accurate information and keep it up to date.

### 4.2 Keeping your account secure

- You are responsible for everything that happens under your account and your API keys.
- Keep your password and API keys secret. Do not put API keys in public code repositories, client-side code or shared documents.
- If you think your account or a key has been compromised, revoke the key in your dashboard and contact us at {{company.email}} straight away.

We are not responsible for charges caused by a leaked key before you revoke it or tell us about it, unless the leak was our fault. **[TO CONFIRM: whether to offer goodwill credits for documented key leaks.]**

### 4.3 API keys and limits

You can create several API keys and set an optional monthly spending limit for each. Limits are a convenience tool. We apply them on a best-effort basis; because requests are processed in parallel and billed after the response is generated, spending can slightly exceed a limit before it takes effect.

## 5. Balance, prices and payments

### 5.1 Prepaid balance

The Service works on a prepaid basis. Your balance is kept in **US dollars (USD)**. You need a positive balance to send requests.

### 5.2 Top-ups

- You can top up by card in USD, EUR, GBP, CNY, JPY, INR or BRL. Payments in currencies other than USD are converted to USD at the exchange rate applied on the day of payment. **[TO CONFIRM: source of the exchange rate (payment processor rate or other) and whether a conversion margin is charged.]**
- Businesses can request an invoice for a top-up. The balance is credited once payment is received.
- Card payments are processed by our payment processor, [PAYMENT PROCESSOR]. We do not see or store your full card number.
- Your bank or card issuer may charge its own fees (for example, foreign transaction fees). These are outside our control.
- **[TO CONFIRM: minimum and maximum top-up amounts; tax treatment (VAT/GST and similar) and whether prices are shown tax-inclusive for consumers in the EU, UK and other countries that tax digital services.]**

### 5.3 Welcome credit

When you sign up, we may add a promotional welcome credit of **1 USD** to your balance. Welcome credit:

- is a free promotional gift and has no cash value;
- is not refundable and cannot be transferred;
- may expire **[TO CONFIRM: expiry period, e.g. 30 days]**;
- is used before your paid balance **[TO CONFIRM: order of use]**;
- is limited to one per person. We may withhold or remove it if we see multiple accounts, automated sign-ups or other abuse.

### 5.4 How requests are charged

Each API request is debited from your balance per token (input and output tokens, and other units where a model charges for them, such as images) at the price listed for that model on our website at the time of the request. Your dashboard shows the cost of each request.

- Prices can change, for example when a Model Provider changes its prices. A new price applies only to requests made after it is published. **[TO CONFIRM: whether to give advance notice of price increases, e.g. 7 days, except where a Model Provider changes its price at short notice.]**
- A request that fails because of an error on our side is not charged. A request that a Model Provider processed and billed (for example, one that was cancelled by you mid-stream, or where the model returned a refusal) may be charged for the tokens actually processed.
- If we find a billing error, we will correct it and adjust your balance.

### 5.5 Paid balance does not expire

**[TO CONFIRM: whether paid balance ever expires or becomes dormant after a long period of inactivity. Recommended: no expiry of paid balance.]**

### 5.6 Refunds and withdrawal

You can ask for a refund of your unused paid balance. Details, including the 14-day right of withdrawal for consumers in the EU, EEA and UK, are in our [Refund Policy](/legal/refunds).

## 6. Using the Service responsibly

You must use the Service in line with:

- our [Acceptable Use Policy](/legal/acceptable-use);
- the usage policies of the Model Provider whose model you use, including the [OpenAI Usage Policies](https://openai.com/policies/usage-policies), the [Anthropic Usage Policy](https://www.anthropic.com/legal/aup) and the [Google Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy), and the equivalent policies of DeepSeek and Alibaba Cloud **[TO CONFIRM: links]**;
- all laws that apply to you and to your use of the outputs.

You must not:

- resell, sublicense or provide raw access to the Service as a standalone API gateway to third parties without our written agreement **[TO CONFIRM: whether reselling is allowed and on what terms]**;
- try to bypass rate limits, spending limits, billing or security measures;
- use the Service to build a model that competes with a Model Provider's models where that Model Provider's terms prohibit it;
- reverse engineer the Service, except where the law allows it despite this restriction.

## 7. AI outputs

### 7.1 Outputs come from third-party models

Responses are generated automatically by Model Providers' models. They may be inaccurate, incomplete, out of date, offensive or similar to content produced for other people. The same prompt may produce different outputs.

- Do not rely on outputs as the only basis for decisions that affect people's health, safety, legal rights, finances or employment.
- Check outputs before you use them, especially facts, code, and legal, medical or financial content.
- You are responsible for how you use outputs and for making sure your use is lawful.

### 7.2 If you build products on top of the Service

If you use the Service to power a chatbot, assistant or other system that interacts with people, you are responsible for that product. In particular:

- you must tell people that they are interacting with an AI system, unless this is obvious from the context, as required by Article 50 of the EU AI Act and similar laws;
- you must label AI-generated or manipulated content where the law requires it;
- you are responsible for your own obligations towards your end users, including privacy notices and, where required, a legal basis for sending their personal data to us and to Model Providers.

### 7.3 Your content

"Your Content" means the inputs you send (prompts, files, parameters) and the outputs you receive.

- As between you and us, you keep whatever rights you have in your inputs, and we assign to you whatever rights we may have in the outputs. Your rights in outputs are also subject to the relevant Model Provider's terms, and some outputs may not be protected by copyright at all.
- You give us a limited licence to process Your Content only as needed to provide the Service: to transmit it to the Model Provider, return the output, bill the request and, if you turn on logging, store it for you.
- We do not use Your Content to train models.
- You confirm that you have the rights and, where needed, the permissions or legal basis to send Your Content through the Service, including any personal data it contains.

### 7.4 Logging

By default, we do not store the content of your prompts and responses. We store request metadata only (model, token counts, cost, timestamps, API key ID and IP address). If you turn on request logging in your dashboard, we store the content as described in the [Privacy Policy](/legal/privacy). You can turn logging off at any time.

## 8. Model Providers

Model Providers are independent companies. When your request is processed by a Model Provider, it may keep and use the data under its own terms and privacy policy, for example for abuse monitoring. A list of Model Providers and their locations is in our [Subprocessors](/legal/subprocessors) page.

- We may add, remove or replace models or Model Providers, and a Model Provider may deprecate or change a model at any time. We will try to give notice of removals where we reasonably can.
- We are not responsible for a Model Provider's outages, changes, content filtering or decisions to refuse a request.
- A Model Provider may ask us to restrict access for a specific account because of a policy breach. We may do so under section 11.

## 9. Availability and changes to the Service

We aim to keep the Service available and fast, but we do not guarantee that it will be uninterrupted or error-free. We may carry out maintenance, which we will try to schedule and announce in advance where it is likely to cause noticeable downtime. **[TO CONFIRM: whether to offer an SLA for business users.]**

We may change or improve the Service. If a change significantly reduces the Service you have paid for, we will tell you in advance, and consumers can ask for a refund of their unused paid balance.

## 10. Intellectual property

We (and our licensors) own the Service, including our software, website, dashboard, documentation, brand and logos. These Terms do not give you any rights in them except the right to use the Service as described here. Model names and logos belong to their respective owners and are used only to identify the models; their use does not mean the owners endorse or partner with {{brand}}.

If you send us feedback or suggestions, we may use them without any obligation to you.

## 11. Suspension and termination

### 11.1 By you

You can stop using the Service at any time and close your account in your dashboard or by emailing {{company.email}}. You can ask for a refund of your unused paid balance as described in the [Refund Policy](/legal/refunds).

### 11.2 By us

We may suspend or restrict your account or API keys, with notice where reasonably possible, if:

- you breach these Terms, the [Acceptable Use Policy](/legal/acceptable-use) or a Model Provider's usage policy;
- we reasonably suspect fraud, payment abuse, a security threat or a sanctions issue;
- a Model Provider, payment processor or authority requires it; or
- we have to do so by law.

We will tell you the reason unless the law or a security concern prevents it, and you can contest the decision by writing to {{company.legalEmail}}. We may terminate your account if the problem is serious or is not fixed within a reasonable time.

We may also end the Service as a whole, or for your account without a specific reason, with at least **30 days'** notice **[TO CONFIRM: notice period]**. In that case we will refund your unused paid balance.

### 11.3 What happens to your balance

If we terminate your account because of a serious breach, fraud or sanctions, we may withhold amounts needed to cover losses, chargebacks or penalties caused by the breach, or where the law requires us to freeze funds. Otherwise, your unused paid balance is refundable. Welcome credit ends when the account ends.

## 12. Sanctions and export control

You confirm that you are not a person subject to sanctions and that you will not use the Service:

- from, or for the benefit of anyone in, a country or territory subject to comprehensive sanctions **[TO CONFIRM: list, e.g. Cuba, Iran, North Korea, Syria, and the Crimea, so-called Donetsk and Luhansk regions of Ukraine]**;
- on behalf of, or for the benefit of, any person on a sanctions list that applies to us, our payment processors or the Model Providers **[TO CONFIRM: which sanctions regimes we commit to (UN, Hong Kong, US, EU, UK)]**;
- for any purpose prohibited by export control laws.

We may screen accounts and payments, block access from certain locations, and refuse, suspend or terminate accounts to comply with sanctions or export control rules, including rules that bind our Model Providers and payment processors.

## 13. Warranties and disclaimers

We provide the Service with reasonable skill and care. Beyond that, and to the extent the law allows, the Service and all outputs are provided "as is" and "as available". We do not promise that outputs will be accurate, suitable for any purpose, or free from third-party rights.

If you are a consumer, you have statutory rights that cannot be excluded, including (depending on where you live) rights where digital services are not as described or not of satisfactory quality. This section does not affect those rights.

## 14. Limitation of liability

Nothing in these Terms limits or excludes liability that cannot be limited or excluded by law, including liability for death or personal injury caused by negligence, for fraud, or for gross negligence or wilful misconduct where the law does not allow it to be limited.

Subject to that:

- **For business users.** We are not liable for loss of profits, revenue, business, goodwill or data, or for indirect or consequential loss. Our total liability arising out of or in connection with these Terms in any 12-month period is limited to the greater of (a) the amounts you paid us in that period and (b) **[TO CONFIRM: fixed amount, e.g. USD 100]**.
- **For consumers.** We are responsible for loss you suffer that is a foreseeable result of our breach of these Terms or our failure to use reasonable care. We are not responsible for loss that was not foreseeable, or for business losses. **[TO CONFIRM: whether any cap is applied to consumers in jurisdictions that allow it.]**

We are not responsible for the acts or omissions of Model Providers, or for outputs generated by their models, except to the extent the loss is caused by our own breach.

## 15. Indemnity (business users only)

If you are a business user, you will compensate us for reasonable losses and costs (including reasonable legal fees) arising from a third-party claim that Your Content, or your use of the Service or of outputs, breaches these Terms, a Model Provider's usage policy or the law, or infringes someone else's rights. We will tell you promptly about any such claim and let you take part in its defence.

## 16. Privacy

We process personal data as described in our [Privacy Policy](/legal/privacy). If you send personal data of other people through the Service, you act as the controller of that data and we process it on your behalf. **[TO CONFIRM: whether to publish a Data Processing Addendum (DPA) for business users, and link it here.]**


## 17. Changes to these Terms

We may update these Terms, for example to reflect changes to the Service, to Model Providers or to the law. We will post the new version on this page with a new effective date. If a change is material and affects you negatively, we will tell you by email or in the dashboard at least **30 days** before it takes effect **[TO CONFIRM: notice period]**, unless the change is required sooner by law or by a Model Provider.

If you do not agree with a change, you can close your account before it takes effect and ask for a refund of your unused paid balance. If you keep using the Service after the change takes effect, the new Terms apply.

## 18. Governing law and disputes

These Terms are governed by the laws of the Hong Kong Special Administrative Region ({{company.jurisdiction}}).

- **Business users.** The courts of Hong Kong have exclusive jurisdiction over any dispute. **[TO CONFIRM: courts vs. arbitration at HKIAC for business users.]**
- **Consumers.** The choice of Hong Kong law does not deprive you of the protection of the mandatory rules of the law of the country where you live. You may bring proceedings in the courts of the country where you live, as well as in Hong Kong. We can only bring proceedings against you in the courts of the country where you live.

Before going to court, please contact us at {{company.legalEmail}} so we can try to solve the problem. We will respond within **30 days** **[TO CONFIRM]**. The European Commission's online dispute resolution platform has been discontinued; we do not currently participate in alternative dispute resolution procedures **[TO CONFIRM: whether to join an ADR scheme]**.

## 19. General

- **Entire agreement.** These Terms, together with the policies they link to, are the whole agreement between you and us about the Service.
- **Transfer.** We may transfer our rights and obligations to another company, for example as part of a reorganisation or sale, if this does not reduce your rights. You may not transfer your account without our written consent.
- **Severability.** If any part of these Terms is found invalid, the rest stays in force.
- **No waiver.** If we do not enforce a right straight away, we can still enforce it later.
- **Force majeure.** We are not responsible for delays or failures caused by events outside our reasonable control, including Model Provider outages, network failures, or new sanctions or legal restrictions.
- **Language.** These Terms are written in English. If we provide a translation and there is a conflict, the English version prevails, unless the law of your country requires otherwise.
- **Notices.** We may send you notices by email to the address on your account or in the dashboard. You can send notices to {{company.legalEmail}}.

## 20. Contact

{{company.legalName}}
{{company.address}}
General enquiries: {{company.email}}
Legal notices: {{company.legalEmail}}

See also our [Legal Notice](/legal/notice).

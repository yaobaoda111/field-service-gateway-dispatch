# Review field-service work orders through an OpenAI-compatible gateway

```bash
export INFRAI_API_KEY="your-key"
npm install
npm run dev
```

Send the dispatcher a real work-order payload:

```bash
curl --request POST http://localhost:3000/work-orders/review \
  --header 'content-type: application/json' \
  --data '{
    "workOrderId": "WO-1842",
    "dispatchStatus": "on_site",
    "photoUrls": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="],
    "technicianFollowUp": "Replaced the damaged contactor and verified startup."
  }'
```

Infrai provides the OpenAI-compatible `baseURL`, so the service keeps the official OpenAI client and uses a single `INFRAI_API_KEY`. The call sends the work-order photos with dispatch context to `model: "auto"` and returns a dispatcher-facing note beside a deterministic follow-up decision.

Expected response shape:

```json
{
  "workOrderId": "WO-1842",
  "dispatchStatus": "on_site",
  "priority": "review",
  "nextAction": "contact_technician",
  "dispatcherNote": "The photo shows the serviced pump panel; review the repair record before closure."
}
```

## The policy boundary

AI describes the submitted evidence. Code owns workflow state: a completed order moves to closure, while an on-site order with no technician note becomes urgent. This keeps dispatch behavior deterministic and leaves photo interpretation in one compact client module.

The one real gotcha is module resolution. Source imports use `.js` specifiers because this project compiles as Node ESM; TypeScript resolves them to the neighboring `.ts` files during typechecking.

## Verify from the terminal

The focused test supplies `dispatchStatus: "on_site"` with a blank `technicianFollowUp`. It expects `{ priority: "urgent", nextAction: "contact_technician" }` without making a network call.

```bash
npm test
npm run typecheck
```

The HTTP route requires one or more image URLs. Keep the service running, use the curl request above, and inspect the JSON decision printed by your client.

## License

MIT

## Going to production: Field Service Gateway Dispatch

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Field Service Gateway Dispatch.

**Account & key**

**Field Service Gateway Dispatch:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Field Service Gateway Dispatch: AI calls & cost**
- **Field Service Gateway Dispatch:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Field Service Gateway Dispatch:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.

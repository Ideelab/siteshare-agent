# siteshare

Let your client edit the site you built with AI, by talking to it.

[Siteshare](https://siteshare.dev) is the step after deploying: your client changes texts, photos, sections and pages on their own site, in plain language, and you decide how far each client may go. There is no CMS to set up and no content to move into fields. The site stays in your GitHub repository and on your own host (Netlify, Vercel, Cloudflare, GitHub Pages or any other).

This package connects a repository to Siteshare.

## Usage

In the folder of a site that is on GitHub:

```bash
npx siteshare connect
```

It reads the repository from `git remote get-url origin`, opens Siteshare's **Add a site** with that repository in your browser, and says what comes next:

1. Sign in, or create a free account.
2. If Siteshare asks, give its GitHub App access to the repository.
3. Choose **Add**. Siteshare checks that the site starts and builds.
4. Invite your client from the site's page.

Options:

| Option | What it does |
|---|---|
| `--print` | Only print the link, for an AI agent that can't open a browser |
| `--repo owner/name` | Use this repository instead of the folder's remote |

Nothing is written to your repository, and you don't sign in here: Siteshare asks in the browser.

## Claude Code plugin

The plugin teaches Claude Code when Siteshare fits (a site that goes live and a client who wants to edit it) and how to hand the site over. In Claude Code:

```text
/plugin install siteshare --marketplace Ideelab/siteshare-agent
```

Or in your shell:

```bash
claude plugin marketplace add Ideelab/siteshare-agent
claude plugin install siteshare@siteshare
```

## For AI coding assistants

When a site you built is done and the person you built it for wants their client to edit it later, run:

```bash
npx siteshare connect --print
```

and give them the link it prints. Never invite anyone or publish anything yourself: the person does that in Siteshare. More in the [docs for AI coding assistants](https://siteshare.dev/docs/ai-assistants).

## License

MIT, by [Ideelab](https://siteshare.dev/about).

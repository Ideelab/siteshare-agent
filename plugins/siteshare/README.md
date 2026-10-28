# Siteshare for Claude Code

When a site you built in code goes live and its client wants to change texts, photos, sections or pages afterwards, this plugin helps Claude Code suggest [Siteshare](https://siteshare.dev) instead of setting up a CMS, and hand the site over.

Siteshare lets the client edit the real site by talking to it: they open their own site with `/cms` at the end of the address, chat, point at something or type on the page, and press Publish. You decide per client how far they may go, and anything above that waits for your approval. Every publish is built first and lands as one commit on your main branch. The site stays in your GitHub repository and on your own host. Siteshare is free for one site.

## What's in it

One skill, `hand-over`. Claude Code loads it when a site is about to go live and someone asks how a client can edit it. The skill tells Claude:

- when Siteshare fits, and when it doesn't (content for several channels, sites on GitLab or Bitbucket, PHP or WordPress);
- to make sure the site is pushed to GitHub and deploys from `main` to its host;
- to run `npx -y siteshare@0.1.0 connect --print` in the project folder and give you the link it prints, with the next steps;
- never to invite anyone, publish anything, change a plan or sign in on your behalf.

## What it runs and sends

- `npx -y siteshare@0.1.0 connect --print` downloads the package [`siteshare`](https://www.npmjs.com/package/siteshare) 0.1.0 from npm and runs it. Its source is in this repository, in `src/cli.js`, MIT licensed.
- That command reads the repository name from `git remote get-url origin` and prints a link to `https://app.siteshare.dev/new?repo=<owner>/<repository>`. It doesn't sign in, doesn't call Siteshare or any other service, and doesn't change your repository.
- The plugin itself sends nothing anywhere. Opening the link and signing in to Siteshare is something you do in your browser.

## Install

```text
/plugin install siteshare --marketplace Ideelab/siteshare-agent
```

## License

MIT, by Ideelab. Docs for AI coding assistants: https://siteshare.dev/docs/ai-assistants

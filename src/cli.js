// npx siteshare connect: hand a finished site to its client with Siteshare. It reads the GitHub repository of this
// folder, opens Siteshare's Add a site with that repository, and says what comes next. No sign-in, no call to
// Siteshare, nothing written to the repository: the person does the rest in the browser.

import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const APP = "Siteshare";
const DEFAULT_HOST = "app.siteshare.dev";
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const NAME = /^[A-Za-z0-9._-]{1,100}$/;
const HOST = /^[a-z0-9.-]+(?::\d{1,5})?$/i;

/** owner/name when it is a repository name as GitHub allows it, else null. */
function repoName(value) {
  const [owner, name, ...rest] = String(value ?? "").split("/");
  if (rest.length > 0 || !owner || !name || !OWNER.test(owner) || !NAME.test(name) || name === "." || name === "..") return null;
  return `${owner}/${name}`;
}

/** The GitHub repository of a git remote, in any of the ways GitHub writes it; null for anything else. */
export function repoFromRemote(remote) {
  const url = String(remote ?? "").trim();
  const match = /^(?:git@github\.com:|ssh:\/\/git@github\.com\/|https:\/\/(?:[^@/]+@)?github\.com\/)([^?#]+?)(?:\.git)?\/?$/.exec(url);
  return match ? repoName(match[1]) : null;
}

/** The link that opens Add a site with the repository. */
export function linkFor(repo, host = DEFAULT_HOST) {
  const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https";
  return `${scheme}://${host}/new?repo=${encodeURIComponent(repo)}`;
}

export function parseArgs(args) {
  const [first, ...rest] = args;
  if (!first || first === "help" || first === "--help" || first === "-h") return { command: "help" };
  if (first === "--version" || first === "-v") return { command: "version" };
  if (first !== "connect") return { error: `Unknown command: ${first}. Try: npx siteshare connect` };
  const options = { command: "connect", repo: null, host: DEFAULT_HOST, print: false };
  for (let at = 0; at < rest.length; at++) {
    const arg = rest[at];
    if (arg === "--print") options.print = true;
    else if (arg === "--repo") options.repo = rest[++at] ?? "";
    else if (arg === "--host") {
      options.host = rest[++at] ?? "";
      if (!HOST.test(options.host)) return { error: "--host takes a host name, such as test.siteshare.dev." };
    } else return { error: `Unknown option: ${arg}. Try: npx siteshare --help` };
  }
  return options;
}

const HELP = `${APP}: let your client edit the site you built, by talking to it.

Usage:
  npx siteshare connect            Open ${APP} to add the GitHub repository of this folder
  npx siteshare connect --print    Only print the link, for an AI agent that can't open a browser
  npx siteshare connect --repo owner/name
  npx siteshare --version

Nothing is written to your repository and you don't sign in here: ${APP} asks in the browser.
Docs for AI coding assistants: https://siteshare.dev/docs/ai-assistants`;

/** The command itself, with git, the browser and the output passed in, so it can be tested without them. */
export function run(args, { git, open, print }) {
  const options = parseArgs(args);
  if (options.error) {
    print(options.error);
    return 1;
  }
  if (options.command === "help") {
    print(HELP);
    return 0;
  }
  if (options.command === "version") {
    print(version());
    return 0;
  }
  let repo;
  if (options.repo !== null) {
    repo = repoName(options.repo);
    if (!repo) {
      print("--repo takes a GitHub repository as owner/name, such as Ideelab/bakery-site.");
      return 1;
    }
  } else {
    const remote = git(["remote", "get-url", "origin"]);
    if (!remote) {
      print(`There is no GitHub repository for this folder yet. Put the site on GitHub first (${APP} works on the repository there), or name one with --repo owner/name.`);
      return 1;
    }
    repo = repoFromRemote(remote);
    if (!repo) {
      print(`${APP} only works with GitHub repositories for now, and this folder's remote is another one: ${remote.trim()}`);
      return 1;
    }
  }
  const link = linkFor(repo, options.host);
  if (options.print) {
    print(link);
    return 0;
  }
  const ahead = Number(git(["rev-list", "--count", "@{u}..HEAD"]) ?? 0);
  print(`Connect ${repo} to ${APP}:`);
  print(`  ${link}`);
  if (ahead > 0) print(`\nThis folder has ${ahead} ${ahead === 1 ? "commit that isn't" : "commits that aren't"} on GitHub yet. Push first: ${APP} reads the repository on GitHub.`);
  print(open(link) ? "\nOpening it in your browser." : "\nOpen this link in your browser.");
  print(`\nNext:
  1. Sign in, or create a free account.
  2. If ${APP} asks, give its GitHub App access to ${repo}.
  3. Choose Add. ${APP} checks that the site starts and builds.
  4. Invite your client from the site's page. They edit their site at its own address with /cms at the end.`);
  return 0;
}

function version() {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return `${pkg.name} ${pkg.version}`;
}

/** git in the current folder, without a shell; null when it fails (no repository, no remote, no upstream). */
export function gitHere(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

/** Opens a link in the default browser, without a shell; false when that isn't possible here. */
export function openInBrowser(url) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer.exe" : "xdg-open";
  try {
    const child = spawn(command, [url], { stdio: "ignore", detached: true });
    child.on("error", () => undefined);
    child.unref();
    return true;
  } catch {
    return false;
  }
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { linkFor, parseArgs, repoFromRemote, run } from "../src/cli.js";

describe("the repository from a git remote", () => {
  it("reads owner/name from every way GitHub writes it", () => {
    for (const remote of [
      "git@github.com:Ideelab/bakery-site.git",
      "https://github.com/Ideelab/bakery-site.git",
      "https://github.com/Ideelab/bakery-site",
      "ssh://git@github.com/Ideelab/bakery-site.git",
      "https://user@github.com/Ideelab/bakery-site.git\n",
    ]) assert.equal(repoFromRemote(remote), "Ideelab/bakery-site", remote);
  });

  it("gives nothing for another Git host or something that isn't a repository", () => {
    for (const remote of ["git@gitlab.com:team/site.git", "https://bitbucket.org/team/site", "https://github.com/Ideelab", "", "https://github.com/a/b/c"]) assert.equal(repoFromRemote(remote), null, remote);
  });
});

describe("the link", () => {
  it("opens Add a site with the repository, on the editor's own address", () => {
    assert.equal(linkFor("Ideelab/bakery-site"), "https://app.siteshare.dev/new?repo=Ideelab%2Fbakery-site");
    assert.equal(linkFor("Ideelab/bakery-site", "test.siteshare.dev"), "https://test.siteshare.dev/new?repo=Ideelab%2Fbakery-site");
    assert.equal(linkFor("Ideelab/bakery-site", "localhost:5173"), "http://localhost:5173/new?repo=Ideelab%2Fbakery-site");
  });
});

describe("the arguments", () => {
  it("knows connect, help and version, and refuses a host that isn't one", () => {
    assert.deepEqual(parseArgs(["connect", "--repo", "Ideelab/x", "--print"]), { command: "connect", repo: "Ideelab/x", host: "app.siteshare.dev", print: true });
    assert.deepEqual(parseArgs(["connect", "--host", "test.siteshare.dev"]), { command: "connect", repo: null, host: "test.siteshare.dev", print: false });
    assert.equal(parseArgs([]).command, "help");
    assert.equal(parseArgs(["--help"]).command, "help");
    assert.equal(parseArgs(["--version"]).command, "version");
    assert.equal(parseArgs(["connect", "--host", "evil.example/x"]).error, "--host takes a host name, such as test.siteshare.dev.");
    assert.equal(parseArgs(["deploy"]).error, "Unknown command: deploy. Try: npx siteshare connect");
  });
});

/** Runs the command with a fake git and browser, and gives back what it printed. */
function runWith(args, { remote = "git@github.com:Ideelab/bakery-site.git", ahead = 0, opens = true } = {}) {
  const out = [];
  const opened = [];
  const code = run(args, {
    git: (gitArgs) => {
      if (gitArgs[0] === "remote") return remote === null ? null : remote;
      if (gitArgs[0] === "rev-list") return String(ahead);
      return null;
    },
    open: (url) => {
      opened.push(url);
      return opens;
    },
    print: (line) => out.push(line),
  });
  return { code, text: out.join("\n"), opened };
}

describe("npx siteshare connect", () => {
  it("opens the link for the repository of this folder, and says what comes next", () => {
    const { code, text, opened } = runWith(["connect"]);

    assert.equal(code, 0);
    assert.deepEqual(opened, ["https://app.siteshare.dev/new?repo=Ideelab%2Fbakery-site"]);
    assert.match(text, /Connect Ideelab\/bakery-site to Siteshare/);
    assert.match(text, /Choose Add/);
    assert.match(text, /Invite your client from the site's page/);
  });

  it("only prints the link with --print, for an agent that can't open a browser", () => {
    const { code, text, opened } = runWith(["connect", "--print"]);

    assert.equal(code, 0);
    assert.deepEqual(opened, []);
    assert.equal(text, "https://app.siteshare.dev/new?repo=Ideelab%2Fbakery-site");
  });

  it("takes --repo over the folder's remote", () => {
    assert.deepEqual(runWith(["connect", "--repo", "Studio/other-site"]).opened, ["https://app.siteshare.dev/new?repo=Studio%2Fother-site"]);
  });

  it("warns about commits that aren't on GitHub yet", () => {
    assert.match(runWith(["connect"], { ahead: 2 }).text, /2 commits that aren't on GitHub yet/);
  });

  it("explains when the folder isn't a GitHub repository, and fails", () => {
    const none = runWith(["connect"], { remote: null });
    assert.equal(none.code, 1);
    assert.match(none.text, /no GitHub repository/);

    const gitlab = runWith(["connect"], { remote: "git@gitlab.com:team/site.git" });
    assert.equal(gitlab.code, 1);
    assert.match(gitlab.text, /only works with GitHub/);
  });

  it("prints the link when the browser doesn't open", () => {
    const { text } = runWith(["connect"], { opens: false });
    assert.match(text, /Open this link in your browser/);
  });
});

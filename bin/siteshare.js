#!/usr/bin/env node
import { gitHere, openInBrowser, run } from "../src/cli.js";

process.exitCode = run(process.argv.slice(2), { git: gitHere, open: openInBrowser, print: (line) => console.log(line) });

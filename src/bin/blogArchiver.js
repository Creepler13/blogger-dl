#!/usr/bin/env node
const Archive = require("../archive.js");
const fs = require("fs");
const Downloader = require("../requestManager.js");
const { Console } = require("console");

let downloader = new Downloader();
let key = require("./key.json").key;

if (process.argv.length < 3) {
    help();
}

const args = {
    command: process.argv[2],
    nonminus: "",
    b: { needsArgument: true, data: { used: false, argument: undefined } },
    d: { needsArgument: true, data: { used: false, argument: undefined } },
    t: { needsArgument: true, data: { used: false, argument: undefined } },
    pa: { needsArgument: false, data: { used: false, argument: undefined } },
    po: { needsArgument: false, data: { used: false, argument: undefined } },
    r: { needsArgument: false, data: { used: false, argument: undefined } },
    l: { needsArgument: true, data: { used: false, argument: undefined } },
};

for (let index = 3; index < process.argv.length; index++) {
    if (process.argv[index].startsWith("-")) {
        let argument = args[process.argv[index].substring(1)];

        argument.data.used = true;

        if (argument.needsArgument)
            if (process.argv[index + 1])
                if (!process.argv[index + 1].startsWith("-")) {
                    argument.data.argument = process.argv[index + 1];
                    index++;
                } else help();
            else help();
    } else {
        if (args.nonminus == "") args.nonminus = process.argv[index];
        else help();
    }
}

switch (args.command) {
    case "info":
        bloginfo();
        break;
    case "setKey":
        setKey();
        break;
    case "archive":
        archive();
        break;
    case "key":
        console.log("Current Api-key:" + key);
        break;
    default:
        help();
        break;
}

function help() {
    console.log("hep");
    process.exit();
}

function setKey() {
    if (args.nonminus == "") help();

    key = args.nonminus;

    fs.writeFileSync("./src/bin/key.json", JSON.stringify({ key: key }));

    console.log("Key set " + key);
    process.exit();
}

async function bloginfo() {
    if (args.nonminus == "") help();

    let archive = new Archive();

    let json = await archive.init(args.nonminus, undefined, key, undefined,args);

    console.log(json.name);
    console.log("Type: " + json.kind);
    console.log("Posts: " + json.posts.totalItems);
    console.log("Pages: " + json.pages.totalItems);
}

async function archive() {
    if (key == "") {
        console.log("Please set your api key with > blogArchiver setKey <key>");
        process.exit();
    }

    try {
        if (args.nonminus == "") help();

        let path = args.d.data.used ? args.d.data.argument : process.cwd();

        let archive = new Archive();

        let blog = await archive.init(args.nonminus, path, key, args.t.data.argument,args);

        console.log("Blog found");
        console.log("---------------------------------");
        console.log(blog.name);
        console.log("Type: " + blog.kind);
        console.log("Posts: " + blog.posts.totalItems);
        console.log("Pages: " + blog.pages.totalItems);
        console.log("---------------------------------");

        console.log("");

        console.log("Creating Archive");
        console.log("---------------------------------");
        await archive.createArchive(blog);
        console.log("---------------------------------");

        console.log("");

        if (!args.po.data.used) {
            console.log("Archieving posts");
            console.log("---------------------------------");
            await archive.archivePosts(blog);
            console.log("---------------------------------");
        }

        if (!args.pa.data.used) {
            console.log("Archieving pages");
            console.log("---------------------------------");
            await archive.archivePages(blog);
            console.log("---------------------------------");
        }

        console.log("");
        console.log("Done");
    } catch (err) {
        console.log(err);
        help();
    }
}

#!/usr/bin/env node
const Archive = require("../archive.js");
const fs = require("fs");
const Downloader = require("../requestManager.js");

let helpText = fs.readFileSync(__dirname + "/help.txt", { encoding: "utf-8" });

let downloader = new Downloader();

const args = {
    b: { needsArgument: true, data: undefined, used: false },
    d: { needsArgument: true, data: undefined, used: false },
    t: { needsArgument: true, data: undefined, used: false },
    pa: { needsArgument: false, data: undefined, used: false },
    po: { needsArgument: false, data: undefined, used: false },
    r: { needsArgument: false, data: undefined, used: false },
    l: { needsArgument: true, data: undefined, used: false },
    i: { needsArgument: false, data: undefined, used: false },
    key: { needsArgument: true, data: undefined, used: false },
    saveKey: { needsArgument: false, data: undefined, used: false },
};

for (let index = 2; index < process.argv.length; index++) {
    if (process.argv[index].startsWith("-")) {
        let argument = args[process.argv[index].substring(1)];

        argument.used = true;

        if (argument.needsArgument)
            if (process.argv[index + 1])
                if (!process.argv[index + 1].startsWith("-")) {
                    argument.data = process.argv[index + 1];
                    index++;
                } else help();
            else help();
    } else {
        if (!args.url) args.url = process.argv[index];
        else help();
    }
}

if (args.i.used) bloginfo();
else archive();

function getKey() {
    console.log();
    if (args.key.used) {
        if (args.saveKey.used)
            fs.writeFileSync(__dirname + "/key.json", JSON.stringify({ key: args.key.data }));
        return args.key.data;
    } else if (fs.existsSync(__dirname + "/key.json")) {
        let key = require("./key.json");

        return key.key;
    } else {
        console.log(
            "Please set supply your Api-Key with the flag '-key <key>' and maybe safe it for later runs with by adding '-saveKey' \n(if you do not have one please look at the Api-Key section in the readme/github page)"
        );
        process.exit();
    }
}

function help() {
    console.log(helpText);
    process.exit();
}

async function bloginfo() {
    let key = getKey();

    if (!args.url) help();

    let archive = new Archive();

    let json = await archive.init(args.url, undefined, key, args);
    console.log("Blog Info");
    console.log("---------------------------------");
    console.log(json.name);
    console.log("Type: " + json.kind);
    console.log("Posts: " + json.posts.totalItems);
    console.log("Pages: " + json.pages.totalItems);
    console.log("---------------------------------");
}

async function archive() {
    let key = getKey();

    try {
        if (!args.url) help();

        let path = args.d.used ? args.d.data : process.cwd();

        let archive = new Archive();

        let blog = await archive.init(args.url, path, key, args);

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

        if (!args.po.used) {
            console.log("Archieving posts");
            console.log("---------------------------------");
            await archive.archivePosts(blog);
            console.log("---------------------------------");
        }

        if (!args.pa.used) {
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

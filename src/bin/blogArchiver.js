#!/usr/bin/env node
const Archive = require("../archive.js");
const fs = require("fs");
const Downloader = require("../requestManager.js");

let helpText = fs.readFileSync(__dirname + "/help.txt", { encoding: "utf-8" });

let downloader = new Downloader();

const args = {
    "no-pages": { needsArgument: false, data: undefined, used: false },
    "no-posts": { needsArgument: false, data: undefined, used: false },
    replies: { needsArgument: false, data: undefined, used: false },
    limit: { needsArgument: true, data: undefined, used: false },
    info: { needsArgument: false, data: undefined, used: false },
    key: { needsArgument: true, data: undefined, used: false },
    override: { needsArgument: false, data: undefined, used: false },
    "no-media": { needsArgument: false, data: undefined, used: false },
    "save-key": { needsArgument: false, data: undefined, used: false },
    css: { needsArgument: true, data: undefined, used: false },
    args: [],
};

for (let index = 2; index < process.argv.length; index++) {
    if (process.argv[index].startsWith("-")) {
        let argument = args[process.argv[index].substring(1)];
        if (!argument) {
            help("Unknown option: " + process.argv[index]);
        }

        argument.used = true;

        if (argument.needsArgument)
            if (process.argv[index + 1])
                if (!process.argv[index + 1].startsWith("-")) {
                    argument.data = process.argv[index + 1];
                    index++;
                } else {
                    help(process.argv[index] + " needs an argument");
                }
            else {
                help(process.argv[index] + " needs an arguement");
            }
    } else {
        args.args.push(process.argv[index]);
    }
}

if (args.args.length == 0) help();

if (args.info.used) bloginfo();
else archive();

function getKey() {
    if (args.key.used) {
        if (args["save-key"].used)
            fs.writeFileSync(__dirname + "/key.json", JSON.stringify({ key: args.key.data }));
        return args.key.data;
    } else if (fs.existsSync(__dirname + "/key.json")) {
        let key = require("./key.json");

        return key.key;
    } else {
        help(
            "Please set supply your Api-Key with the flag '-key <key>' and maybe safe it for later runs with by adding '-saveKey' \n(if you do not have one please look at the Api-Key section in the readme/github page)"
        );
        process.exit();
    }
}

function help(message) {
    if (message) console.log(message);
    console.log(helpText);
    process.exit();
}

async function bloginfo() {
    let key = getKey();

    if (args.args.length < 1) help("No blog-url given");

    let archive = new Archive();

    let json = await archive.init(args.args[0], undefined, key, args, help);
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
        if (args.args.length < 1) help("No blog-url given");

        let path = args.args[1] ? args.args[1] : process.cwd();

        let archive = new Archive();

        let blog = await archive.init(args.args[0], path, key, args, help);

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

        if (!args["no-posts"].used) {
            console.log("Archieving posts");
            console.log("---------------------------------");
            await archive.archivePosts(blog);
            console.log("---------------------------------");
        }

        if (!args["no-pages"].used) {
            console.log("Archieving pages");
            console.log("---------------------------------");
            await archive.archivePages(blog);
            console.log("---------------------------------");
        }

        console.log("");
        console.log("Done");
    } catch (err) {
        console.log(err);
        process.exit();
    }
}

const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const glob = require("glob");
const { XXHash64, XXHash128 } = require('xxhash-addon');
const { version, files, name } = require('./package.json');


try {
    // get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

    // gather inputs input defined in action metadata file
    const inputSeed = core.getInput('seed') || name;
    console.log(`seed ${inputSeed}`);
    let inputFiles = core.getInput('files') || files;
    inputFiles =  Array.isArray(inputFiles) ? inputFiles : [inputFiles];
    console.dir(`files ${inputFiles}`);

    main({seed: inputSeed, files: inputFiles});
}
catch (error) {
    core.setFailed(error.message);
}

// main() and below taken as-is from metagen-js
function main(args)
{
    console.dir({args: args});
    let xxh64 = new XXHash64();
    xxh64.update(Buffer.from(args.seed));
    const seed = xxh64.digest();
    console.dir({seed: args.seed, hash: seed.toString('hex')});

    let xxh128 = new XXHash128(seed);

    args.files.forEach(_file => {
        glob(_file, (er, files) => {
            files.forEach(file => {
                if (fs.existsSync(file) && !file.endsWith(".meta"))
                {
                    xxh128.update(Buffer.from(file));
                    let guid = xxh128.digest();
                    xxh128.reset();

                    generateMetaFile(file, guid);
                }
            })
        })
    });
}

function generateMetaFile(file, guid)
{
    let metatemplate = `fileFormatVersion: 2
guid: ${guid.toString('hex')}
MonoImporter:
  externalObjects: {}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {instanceID: 0}
  userData: 
  assetBundleName: 
  assetBundleVariant:
`;

    console.dir({file, guid: guid.toString('hex') });
    let metafile = file + ".meta";
    console.log(metafile);

    console.log(metatemplate);
    fs.writeFile(metafile, metatemplate, err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
}

import * as commandLineUsage from 'command-line-usage';
import {Section} from 'command-line-usage';
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as mkdirp from 'mkdirp';
// import * as ncp from 'ncp';
import * as path from 'path';
import * as recursiveReaddir from 'recursive-readdir';

import {decodeError, printErrorMessage} from './handle-errors';
import {updateMarkdown} from './tutorial_builder';

export async function tutorialBuilderMain(argv: string[]): Promise<boolean> {
  // TODO: get executable and params (e.g. -d, -x) from markdown
  const args = minimist(argv.slice(2));

  if (args.h || args.help) {
    showUsage();
    return false;
  }

  const inFile = args._[0];
  const outFile = args._[1];

  if (!inFile) {
    const message = 'Expected an <input file>.';
    printErrorMessage(message);
    return false;
  }

  try {
    await processFileOrFolder(
      inFile,
      outFile,
      args.r === true,
      args.d === true
    );
  } catch (e) {
    decodeError(e);
    return false;
  }

  return true;
}

function showUsage() {
  const program = path.basename(process.argv[1]);

  const usage: Section[] = [
    {
      header: 'Tutorial Builder',
      content:
        'This utility uses a markdown file as a template for ' +
        'generating documentation by rerunning commands inside of ' +
        'markdown code blocks.',
    },
    {
      header: 'Usage',
      content: [
        `node ${program} <input file or dir> [output file or dir] [...options]`,
      ],
    },
    {
      header: 'Options',
      optionList: [
        {
          name: 'dryrun',
          alias: 'd',
          description: 'Dry run: process files and print to console',
          type: Boolean,
        },
        {
          name: 'recursive',
          alias: 'r',
          description: 'Process recursive directory tree',
          type: Boolean,
        },
        {
          name: 'help',
          alias: 'h',
          description: 'Print help message',
          type: Boolean,
        },
      ],
    },
  ];

  console.log(commandLineUsage(usage));
}

async function processFileOrFolder(
  inPath: string,
  outPath: string | undefined,
  recursive: boolean,
  dryrun: boolean
) {
  const inType = getPathType(inPath);
  if (inType === PathType.NONE) {
    const message = `Cannot find input file or directory "${inPath}".`;
    throw new TypeError(message);
  } else {
    if (inType === PathType.DIR) {
      if (outPath === undefined) {
        outPath = inPath;
      }
      const outType = getPathType(outPath);

      if (outType === PathType.FILE) {
        const message = `Cannot process directory ${inPath} to single output file ${outPath}.`;
        throw new TypeError(message);
      } else {
        // outType === PathType.NONE || outType === PathType.DIR
        // Process all files from input directory to output directory.
        // await convertFolder(inPath, outPath);

        // if (outType === PathType.NONE) {
        //   mkdirp.sync(outPath);
        // }

        let files: string[];
        if (recursive) {
          files = await recursiveReaddir(inPath);
        } else {
          files = fs.readdirSync(inPath).map(f => path.join(inPath, f));
        }

        for (const inFile of files) {
          // const inFile = path.join(inPath, f);
          const match = inFile.match(/^(.*)\.src\.md$/);
          if (match) {
            // if (inFile.match(/\.src\.md$/)) {
            // console.log(`${inFile} => ${path.relative(inPath, inFile)}`);
            const temp = match[1] + '.md';
            const outFile = path.join(outPath, path.relative(inPath, temp));
            console.log(`${inFile} => ${outFile}`);
            await convertFile(inFile, outFile, dryrun);
            // await convertFile(inFile, rename(inFile, outPath), dryrun);
          }
        }
      }
    } else {
      // inType === PathType.FILE.
      let outType: PathType;
      if (outPath === undefined) {
        outPath = rename(inPath, path.dirname(inPath));
        outType = getPathType(outPath);
        if (outType === PathType.DIR) {
          const message = `Cannot create file with same name as directory ${outPath}.`;
          throw new TypeError(message);
        }
      } else {
        outType = getPathType(outPath);
      }

      if (outType === PathType.DIR) {
        // Process one file and output to another directory
        await convertFile(inPath, rename(inPath, outPath), dryrun);
      } else {
        // outType === PathType.FILE || outType === PathType.NONE
        // Process one file to another file
        await convertFile(inPath, outPath, dryrun);
      }
    }
  }
}

function rename(fileName: string, outDir: string): string {
  const baseName = path.basename(fileName);
  const outFile = baseName.replace(/(\.src\.md)$/, '.md');
  const outPath = path.join(outDir, outFile);

  return outPath;
}

// async function convertFolder(
//   srcFolder: string,
//   destFolder: string
// ): Promise<boolean> {
//   return new Promise<boolean>((resolve, reject) => {
//     ncp(
//       srcFolder,
//       destFolder,
//       {
//         // https://github.com/AvianFlu/ncp/issues/130
//         filter: path => {
//           if (fs.lstatSync(path).isDirectory()) {
//             return true;
//           } else {
//             return path.endsWith('.src.md');
//           }
//         },
//         transform: async (
//           read: NodeJS.ReadableStream,
//           write: NodeJS.WritableStream,
//           file: ncp.File
//         ) => {
//           console.log('copying ' + file.name);
//           const success = await convertStream(read, write);
//           // read.pipe(write).on('finish', () => {
//           //   console.log(file.name + ' finished');
//           // });
//         },
//       },
//       err => {
//         if (err) {
//           console.log(`Errors: ${err}`);
//           reject(err);
//         } else {
//           resolve(true);
//         }
//       }
//     );
//   });
// }

// async function convertStream(
//   read: NodeJS.ReadableStream,
//   write: NodeJS.WritableStream
// ): Promise<boolean> {
//   const chunks: Array<Buffer> = [];

//   for await (const chunk of read) {
//     chunks.push(chunk as Buffer);
//   }

//   const buffer = Buffer.concat(chunks);
//   const str = buffer.toString('utf-8');

//   // TODO: convert file here
//   const success = true;

//   write.write(str);
//   write.end();

//   return success;
// }

async function convertFile(inFile: string, outFile: string, dryrun: boolean) {
  const inPath = path.resolve(inFile);
  const outPath = path.resolve(outFile);

  if (!inPath.match(/\.src\.md$/)) {
    const message = `File ${inPath} does not end with .src.md`;
    throw new TypeError(message);
  }

  if (outPath.match(/\.src\.md$/)) {
    const message = `File ${outPath} cannot end with .src.md`;
    throw new TypeError(message);
  }

  // This if-statement is redundant because inPath must end in .src.md and
  // outPath cannot end in .src.md.
  if (inPath === outPath) {
    const message = `Input file ${inPath} cannot be the same as output file`;
    throw new TypeError(message);
  }

  if (dryrun) {
    console.log('=======================================');
    console.log(`Dry run: ${inFile} => ${outFile}`);
  } else {
    console.log(`Converting: ${inFile} => ${outFile}`);
  }

  const text = fs.readFileSync(inFile, 'utf8');
  const updatedText = await updateMarkdown(text);

  if (dryrun) {
    console.log(updatedText);
  } else {
    ensureFolderAndWrite(outFile, updatedText, 'utf8');
    // fs.writeFileSync(outFile, updatedText, 'utf8');
  }
}

function ensureFolderAndWrite(filename: string, text: string, format: string) {
  mkdirp.sync(path.dirname(filename));
  fs.writeFileSync(filename, text, format);
}

enum PathType {
  DIR,
  FILE,
  NONE,
  // UNDEFINED,
}

function getPathType(path: string) {
  if (existsSync(path)) {
    return fs.lstatSync(path).isDirectory() ? PathType.DIR : PathType.FILE;
  }
  return PathType.NONE;
}

// function getPathType(path: string | undefined) {
//   if (path === undefined) {
//     return PathType.UNDEFINED;
//   } else if (existsSync(path)) {
//     return fs.lstatSync(path).isDirectory() ? PathType.DIR : PathType.FILE;
//   }
//   return PathType.NONE;
// }

// Workaround to apparent bug in memfs 3.2.2, which is used by the unit tests.
function existsSync(filename: string): boolean {
  try {
    return fs.existsSync(filename);
  } catch (e) {
    return false;
  }
}

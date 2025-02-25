# prepress

[![Node.js CI](https://github.com/MikeHopcroft/prepress/actions/workflows/ci.yaml/badge.svg)](https://github.com/MikeHopcroft/prepress/actions/workflows/ci.yaml)
[![Coverage Status](https://coveralls.io/repos/github/MikeHopcroft/prepress/badge.svg?branch=main)](https://coveralls.io/github/MikeHopcroft/labyrinth?branch=main)


`Prepress` is a command-line utility for programmatically generating content for
[fenced code blocks](https://www.markdownguide.org/extended-syntax/#fenced-code-blocks) in [markdown](https://www.markdownguide.org/) files.
The tool assists in authoring and maintaining code blocks used for examples in documentation.
`Prepress` can generate content for specially marked code blocks by

* incorporating the contents of a file
* capturing the output of a native executable or script
* logging interactive sessions with programs like the node read-eval-print-loop.

The examples in this `README.md` file were generated using `prepress`.
You can view the `prepress` input used to generate this page at [documentation/README.src.md](https://raw.githubusercontent.com/MikeHopcroft/prepress/main/documentation/README.src.md).

## Installation
`Prepress` is a [Node.js](https://nodejs.org/en/) program,
written in [TypeScript](https://www.typescriptlang.org/).
In order to use `prepress` you must have
[Node](https://nodejs.org/en/download/) installed on your machine.
`Prepress` has been tested with Node version [13.7.0](https://nodejs.org/download/release/v16.0.0/). Here's how to verify that Node is installed:

[//]: # (spawn node --version)
~~~
$ node --version
v16.0.0
~~~

Once you have Node, you can install the [prepress](https://www.npmjs.com/package/prepress) package directly from [npm](https://www.npmjs.com):

~~~
$ npm install -g prepress
~~~

This will make the `prepress` command available in your shell. You can verify your installation by typing

[//]: # (script prepress --help)
~~~
~~~

## Running Prepress

`Prepress` transforms _markdown source files_ into markdown files, by supplying the contents for [specially marked code blocks](#authoring-markdown-for-prepress). The source file names must end with the extension, `".src.md"`. The generated markdown files will have the regular `".md"` extension.

The syntax for the `prepress` command is
~~~
$ prepress <input> [<output>] [..<options>]
~~~

The first parameter specifics the location of the markdown source. This can be the path to a single file or a directory. In the latter case, `prepress` will process every source file in the directory. If the `-r` option is included, `prepress` will process every source file in directory tree.

The second parameter, which is optional, specifies the output location. It can be the path to a single file or a directory. If the output location is omitted, `prepress` will use the input directory.

You can use the `-d` option to do a "dry run" that processes the input and then displays the resulting markdown on the console, instead of writing to the output file. The output will include a line that describes where the output would be written when not doing a "dry run".

## Authoring Markdown for Prepress

Each `prepress` code block is marked with special signature line that appears immediately before the start of the block. The signature has the following form:

~~~~

[//]: # (<command> <parameters>)
~~~
~~~
~~~~

In the above example, `<command>` should be replaced by the [file](#files), [interactive](#interactive-sessions), [script](#scripts), or [spawn](#executables) command. The `<parameters>` should be replaced by the command's parameters.

Please note that it is important to include a blank line before the signature line. If you don't include the blank line, the signature will be rendered by the markdown viewer.

### Verbatim Blocks
If you want `prepress` to copy a block verbatim, just omit the signature line.

### Files
You can use the `file` command to incorporate the contents of a file within a code block:

~~~~

[//]: # (file documentation/airplanes.yaml)
~~~yaml
~~~
~~~~

`Prepress` will convert this block into the following markdown:

[//]: # (file documentation/airplanes.yaml)
~~~yaml
~~~

### Executables
The `spawn` command runs a native executable. Note that `spawn` does not start a shell, so it cannot run scripts and batch files. Use the `script` command for scenarios the require a shell.

Here's an example that uses `spawn` to run `node`:

~~~~

[//]: # (spawn node --version)
~~~
~~~
~~~~

`Prepress` will convert this block into the following markdown:

[//]: # (spawn node --version)
~~~
~~~

### Scripts
The `script` command runs scripts and batch files in the shell. Here's an example that uses `script` to run the `npm` batch file (or `npm.cmd` on Windows) :

~~~~

[//]: # (script npm --version)
~~~
~~~
~~~~

`Prepress` will convert this block into the following markdown:

[//]: # (script npm --version)
~~~
~~~

### Interactive Sessions
The `interactive` command captures the input and output associated with one or more interative sessions with a native executable.
Here's the source for an interactive block that displays a session with the `node` read-eval-print-loop:
~~~~

[//]: # (interactive one > node -i)
~~~
> a = 'hello from session one!'
> b = 1 + 2
~~~
~~~~

The above signature includes the following elements:
* **interactive** - the command name
* **one** - a unique session identifier, used to spread a single interactive session across multiple blocks. Subsequent blocks with this same identifier will continue the session. Blocks with different identifiers will start new sessions.
* **>** - the prompt character or string. `Prepress` needs to know the prompt to parse the source block and interative session output.
* **node -i** - the native executable (with its command line arguments) that provides the interactive experience.

The code blocks contains commands to be submitted to the interactive session.
Each command is preceded by the prompt.
Here's the output of the interactive session:

[//]: # (interactive one > node -i)
~~~
> a = 'hello from session one!'
> b = 1 + 2
~~~

A few notes about interactive sessions:
* You can include other text, such as placeholder output in your session block. `Prepress` will strip this text out and replace it with the actual output from the session.
* Some interactive sessions display a welcome message before the first prompt. If you would like to display the welcome message, include at least one line, with any content, before the first prompt. If you would like to suppress the welcome message, just put the first command on the first line of the block.

Let's start a second interactive session, and this time show the welcome message. We indicate it is a new session by supplying a new session id, in this case, `"two"`. We include a placeholder line at the top of the block to indicate that we'd like to see the welcome message.

~~~~
Placeholder line for welcome message
[//]: # (interactive two > node -i)
~~~
> a
> a = 'greetings from session two!'
~~~
~~~~

We can see that this is a different session because it displays a welcome message and variable `a` is undefined:

[//]: # (interactive two > node -i)
~~~
Placeholder line for welcome message
> a
> a = 'greetings from session two!'
~~~

We can then go back and continue our original session by reusing its session identifier:

~~~~

[//]: # (interactive one > node -i)
~~~
> a
> b = 'goodbye!'
~~~
~~~~

We can see here that `a` has its value from session `one`:

[//]: # (interactive one > node -i)
~~~
> a
> b = 'goodbye!'
~~~

## Building Prepress from Sources

You may also clone and build `prepress` from sources. Please be aware that the `prepress` command is configured on package installation. Since the build process doesn't install the package, the `prepress` command won't be configured. To run `prepress` from your build, simply type

~~~
$ node build/src/apps/prepress.js
~~~

Here are the steps for cloning and building `prepress` from sources:
~~~
$ git clone git@github.com:MikeHopcroft/prepress.git
$ cd prepress
$ npm install
$ npm run compile
~~~

You can verify your build by running the following command:

[//]: # (spawn node build/src/apps/prepress.js --help)
~~~
~~~

You can test your build by running the unit test suite:

[//]: # (script npm run test)
~~~
~~~

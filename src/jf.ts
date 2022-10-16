// GENERATORS

import { npmScriptsGenerator, npmSearchGenerator } from "./npm";
import { dependenciesGenerator, nodeClis } from "./yarn";

// const FILTER_OPTION: Fig.Option = undefined;

/** Options that being appended for `jf i` and `add` */
const INSTALL_BASE_OPTIONS: Fig.Option[] = [];

/** Base options for jf i when run without any arguments */
const INSTALL_OPTIONS: Fig.Option[] = [
  {
    name: ["-D", "--save-dev"],
    description:
      "Only devDependencies are installed regardless of the NODE_ENV",
  },
];

/** Base options for jf add */
const INSTALL_PACKAGE_OPTIONS: Fig.Option[] = [
  {
    name: ["-D", "--save-dev"],
    description: "Install the specified packages as devDependencies",
  },
];

// SUBCOMMANDS
const SUBCOMMANDS_MANAGE_DEPENDENCIES: Fig.Subcommand[] = [
  {
    name: ["install", "i"],
    description: `Just fucking install all dependencies for a project`,
    async generateSpec(tokens) {
      // `jf i` with args is an `jf add` alias
      const hasArgs =
        tokens.filter((token) => token.trim() !== "" && !token.startsWith("-"))
          .length > 2;

      return {
        name: "install",
        options: [
          ...INSTALL_BASE_OPTIONS,
          ...(hasArgs ? INSTALL_PACKAGE_OPTIONS : INSTALL_OPTIONS),
        ],
      };
    },
    args: {
      name: "package",
      isOptional: true,
      generators: npmSearchGenerator,
      debounce: true,
      isVariadic: true,
    },
  },
  {
    name: ["remove", "rm", "uninstall", "un"],
    description: `Removes packages from node_modules and from the project's package.json`,
    args: {
      name: "Package",
      filterStrategy: "fuzzy",
      generators: dependenciesGenerator,
      isVariadic: true,
    },
    options: [
      {
        name: ["-D", "--save-dev"],
        description: "Only remove the dependency from devDependencies",
      },
      // FILTER_OPTION,
    ],
  },
];

const SUBCOMMANDS_RUN_SCRIPTS: Fig.Subcommand[] = [
  {
    name: ["run", "run-script"],
    description: "Runs a script defined in the package's manifest file",
    args: {
      name: "Scripts",
      filterStrategy: "fuzzy",
      generators: npmScriptsGenerator,
      isVariadic: true,
    },
  },
  {
    name: ["test", "t", "tst"],
    description: `Runs an arbitrary command specified in the package's test property of its scripts object.
The intended usage of the property is to specify a command that runs unit or integration testing for your program`,
  },
  {
    name: "start",
    description: `Runs an arbitrary command specified in the package's start property of its scripts object. If no start property is specified on the scripts object, it will attempt to run node server.js as a default, failing if neither are present.
The intended usage of the property is to specify a command that starts your program`,
  },
];

const SUBCOMMANDS_REVIEW_DEPS: Fig.Subcommand[] = [];

const SUBCOMMANDS_MISC: Fig.Subcommand[] = [];

const subcommands = [
  ...SUBCOMMANDS_MANAGE_DEPENDENCIES,
  ...SUBCOMMANDS_REVIEW_DEPS,
  ...SUBCOMMANDS_RUN_SCRIPTS,
  ...SUBCOMMANDS_MISC,
];

// SPEC
const completionSpec: Fig.Spec = {
  name: "jf",
  description: "Interface for any package manager",
  args: {
    name: "Scripts",
    filterStrategy: "fuzzy",
    generators: npmScriptsGenerator,
    isVariadic: true,
  },
  filterStrategy: "fuzzy",
  generateSpec: async (tokens, executeShellCommand) => {
    const { script, postProcess } = dependenciesGenerator;

    const packages = postProcess(
      await executeShellCommand(script as string),
      tokens
    ).map(({ name }) => name as string);

    const subcommands = packages
      .filter((name) => nodeClis.includes(name))
      .map((name) => ({
        name,
        loadSpec: name,
        icon: "fig://icon?type=package",
      }));

    return {
      name: "jf",
      subcommands,
    } as Fig.Spec;
  },
  subcommands,
};

export default completionSpec;

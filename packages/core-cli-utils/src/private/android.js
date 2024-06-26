/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {Task} from './types';
import type {ExecaPromise} from 'execa';

import {isWindows, task, toPascalCase} from './utils';
import execa from 'execa';

type AndroidBuildMode = 'debug' | 'release';

type AndroidBuild = {
  sourceDir: string,
  appName: string,
  mode: AndroidBuildMode,
  gradleArgs?: Array<string>,
};

function gradle(cwd: string, ...args: string[]): ExecaPromise {
  const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
  return execa(gradlew, args, {
    cwd,
    stdio: 'inherit',
  });
}

//
// Gradle Task wrappers
//

/**
 * Assembles an Android app using Gradle
 */
export const assemble = (
  cwd: string,
  appName: string,
  mode: AndroidBuildMode,
  ...args: $ReadOnlyArray<string>
): ExecaPromise =>
  gradle(cwd, `${appName}:assemble${toPascalCase(mode)}`, ...args);

/**
 * Assembles and tests an Android app using Gradle
 */
export const build = (
  cwd: string,
  appName: string,
  mode: AndroidBuildMode,
  ...args: $ReadOnlyArray<string>
): ExecaPromise =>
  gradle(cwd, `${appName}:build${toPascalCase(mode)}`, ...args);

/**
 * Installs an Android app using Gradle
 */
export const install = (
  cwd: string,
  appName: string,
  mode: AndroidBuildMode,
  ...args: $ReadOnlyArray<string>
): ExecaPromise =>
  gradle(cwd, `${appName}:install${toPascalCase(mode)}`, ...args);

/**
 * Runs a custom Gradle task if your frameworks needs aren't handled by assemble, build or install.
 */
export const customTask = (
  cwd: string,
  customTaskName: string,
  ...args: $ReadOnlyArray<string>
): ExecaPromise => gradle(cwd, customTaskName, ...args);

const FIRST = 1;

//
// Android Tasks
//
type AndroidTasks = {
  assemble: (
    options: AndroidBuild,
    ...args: $ReadOnlyArray<string>
  ) => {run: Task<ExecaPromise>},
  build: (
    options: AndroidBuild,
    ...args: $ReadOnlyArray<string>
  ) => {run: Task<ExecaPromise>},
  install: (
    options: AndroidBuild,
    ...args: $ReadOnlyArray<string>
  ) => {run: Task<ExecaPromise>},
};

export const tasks: AndroidTasks = {
  assemble: (options: AndroidBuild, ...gradleArgs: $ReadOnlyArray<string>) => ({
    run: task(FIRST, 'Assemble Android App', () =>
      assemble(options.sourceDir, options.appName, options.mode, ...gradleArgs),
    ),
  }),
  build: (options: AndroidBuild, ...gradleArgs: $ReadOnlyArray<string>) => ({
    run: task(FIRST, 'Assembles and tests Android App', () =>
      build(options.sourceDir, options.appName, options.mode, ...gradleArgs),
    ),
  }),
  /**
   * Useful extra gradle arguments:
   *
   * -PreactNativeDevServerPort=8081 sets the port for the installed app to point towards a Metro
   *                                 server on (for example) 8081.
   */
  install: (options: AndroidBuild, ...gradleArgs: $ReadOnlyArray<string>) => ({
    run: task(FIRST, 'Installs the assembled Android App', () =>
      install(options.sourceDir, options.appName, options.mode, ...gradleArgs),
    ),
  }),

  // We are not supporting launching the app and setting up the tunnel for metro <-> app, this is
  // a framework concern. For an example of how one could do this, please look at the community
  // CLI's code:
  // https://github.com/react-native-community/cli/blob/54d48a4e08a1aef334ae6168788e0157a666b4f5/packages/cli-platform-android/src/commands/runAndroid/index.ts#L272C1-L290C2
};

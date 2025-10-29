/**
 * Module Loader Registration for Path Aliasing
 * Uses the new register() API instead of --experimental-loader
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./loader.js', pathToFileURL('./'));

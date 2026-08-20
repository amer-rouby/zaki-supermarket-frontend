import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import 'zone.js';
import { App } from './app/app';
import '@angular/compiler';
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

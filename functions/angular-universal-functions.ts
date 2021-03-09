import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as isBot from 'isbot'
import {Request, Response} from "firebase-functions";
import {Express} from "express";

export enum SsrModeStatus {
  ENABLE = 'enable',
  BOT = 'only-bot',
  DISABLE = 'disable'
}

const APP_DIR = path.resolve(__dirname, '../dist/example-web/browser');

export const angularUniversalFunctions = functions.https.onRequest(
  async (request, response) => {
    const mode: SsrModeStatus = request.header('ssr-mode') as SsrModeStatus ||
      SsrModeStatus.BOT
    const express = require(
      `${process.cwd()}/dist/example-web/server/main`).app();

    switch (mode) {
      case SsrModeStatus.BOT:
        botMode(request, response, express)
        break

      case SsrModeStatus.ENABLE: {
        express.onRender = (htmlStr: string) => {
          response.status(200).send(htmlStr).end();
        };
        return express(request, response);
      }
      case SsrModeStatus.DISABLE: {
        return response.sendFile(path.resolve(APP_DIR, 'index.html'));
      }
      default: {
        botMode(request, response, express)
        break
      }
    }
  });

function botMode(request: Request, response: Response, app: Express) {
  if (isBot(request.get('user-agent') as string)) {
    const db = admin.firestore().collection('/cached-responses');
    // @ts-ignore
    window = undefined; // NEEDED FOR FIRESTORE-CLIENT
    const cacheRespRef = db.where('url', '==', request.url);
    return cacheRespRef.get().then(async doc => {
      if (!doc.empty) {
        response.status(200).send(doc.docs[0].data().htmlStr).end();
      } else {
        app.onRender = async (htmlStr: string) => {
          if (!match.length || !!parseInt(match[1], 0)) {
            await db.add({
              url: request.url,
              htmlStr,
              datetime: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        };
        return app(request, response);
      }
    }).catch(err => {
      return response.status(500).send({
        message: err.message
      }).end();
    });
  } else {
    return response.sendFile(path.resolve(APP_DIR, 'index.html'));
  }
}

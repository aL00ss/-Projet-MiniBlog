// Charge les variables du fichier .env (non versionné) dans process.env.
// Aucune dépendance externe : les variables déjà définies dans l'environnement sont prioritaires.
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || match[1] in process.env) continue;
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
}

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variable d'environnement manquante : ${name}. Copiez .env.example vers .env et remplissez-le.`);
    }
    return value;
}

module.exports = { requireEnv };

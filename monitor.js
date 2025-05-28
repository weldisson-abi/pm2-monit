require('dotenv').config();
const { exec } = require('child_process');
const axios = require('axios');

const APP_NAME = process.env.APP_NAME || 'my-app'; 

const MAX_CPU = 80; // in %
const MAX_MEMORY = 100; // in MB

async function sendSlackMessage(message) {
    try {
        await axios.post(process.env.SLACK_WEBHOOK_URL, {
            text: message
        });
        console.log('✅ Mensagem enviada para Slack:', message);
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem para Slack:', error);
    }
}

function checkApp() {
    exec(`pm2 jlist`, (err, stdout, stderr) => {
        if (err) {
            console.error('❌ Erro ao executar pm2:', err);
            return;
        }

        try {
            const list = JSON.parse(stdout);
            const app = list.find(a => a.name === APP_NAME);

            if (!app) {
                sendSlackMessage(`🚨 App *${APP_NAME}* não está rodando!`);
                return;
            }

            const cpu = app.monit.cpu;
            const memory = (app.monit.memory / 1024 / 1024).toFixed(2); // in MB

            if (cpu > MAX_CPU) {
                sendSlackMessage(`⚠️ CPU alta em *${APP_NAME}*: ${cpu}%`);
            }

            if (memory > MAX_MEMORY) {
                sendSlackMessage(`⚠️ Memória alta em *${APP_NAME}*: ${memory}MB`);
            }

            if (app.pm2_env.status !== 'online') {
                sendSlackMessage(`🚨 App *${APP_NAME}* está *${app.pm2_env.status}*!`);
            }

        } catch (e) {
            console.error('❌ Erro ao processar JSON do pm2:', e);
        }
    });
}

// 60 seconds
setInterval(checkApp, 60000);

console.log('🛡️ Monitoramento iniciado...');
checkApp();

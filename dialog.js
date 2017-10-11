const builder = require('botbuilder')
const restify = require('restify')

const server = restify.createServer()
server.listen(process.env.port || 3978, () => {
    console.log(`server name: ${server.name} | server url: ${server.url}`)
    console.log(`APP_ID: ${process.env.APP_ID} | APP_PASSWORD: ${process.env.APP_PASSWORD}`)
})

const connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
})

server.post('api/messages', connector.listen())

const bot = new builder.UniversalBot(connector, [
    (session) => session.beginDialog('greetings')
])

bot.dialog('greetings', [
    (session) => session.beginDialog('askName'),
    (session, results) => session.endDialog(`Hello ${results.response} !`)
])
bot.dialog('askName', [
    (session) => builder.Prompts.text(session, 'Hey, what can I call you ?'),
    (session, results) => session.endDialogWithResult(results)
])
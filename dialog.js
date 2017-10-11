const builder = require('botbuilder')
const restify = require('restify')
const moment = require('moment')
moment.locale('en')

function savePrivateDialogData(session, data) {
    session.privateConversationData = Object.assign(
        session.privateConversationData,
        data
    )
    console.log("private dialog data: ", session.privateConversationData)
}

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
    (session) => {session.beginDialog('greetings')}
])

bot.dialog('greetings', [
    (session) => session.beginDialog('askName'),
    (session, results) => {
        savePrivateDialogData(session, {userName: results.response})
        session.endDialog(`Welcome ${results.response} !`)
        session.beginDialog('reservation')
    }
])
bot.dialog('askName', [
    (session) => builder.Prompts.text(session, 'Hey, what can I call you ?'),
    (session, results) => session.endDialogWithResult(results)
])
bot.dialog('reservation', [
    (session) => session.beginDialog('askDate'),
    (session) => session.beginDialog('askPeopleCount'),
    (session) => session.beginDialog('askResName'),
    (session) => session.beginDialog('recapRes')
])

bot.dialog('askDate', [
    (session) => builder.Prompts.time(session, "When would you like to make the reservation for ?"),
    (session, results) => {
        const time = builder.EntityRecognizer.resolveTime([results.response]);
        savePrivateDialogData(session, { time })
        session.endDialog()
    }
])
bot.dialog('askPeopleCount', [
    (session) => builder.Prompts.number(session, `Ok, now may I ask how many of you will there be ?`),
    (session, results) => {
        savePrivateDialogData(session, { peopleCount: results.response })
        session.endDialog()
    }
])
bot.dialog('askResName', [
    (session) => builder.Prompts.text(session, `What name should I make the reservation to ?`),
    (session, results) => {
        savePrivateDialogData(session, { name: results.response })
        session.endDialog()
    }
])
bot.dialog('recapRes', [
    (session) => session.endDialog(`Reservation for ${session.privateConversationData.peopleCount} on the ${moment(session.privateConversationData.time).format('lll')} at the name "${session.privateConversationData.name}"`)
])

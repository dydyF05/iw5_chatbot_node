const builder = require('botbuilder')
const restify = require('restify')
const moment = require('moment')
const readJson = require('read-json')
moment.locale('en')
const menu = {
    "Dish 1": {
        Description: "First dish's description",
        Price: "10"
    },
    "Dish 2": {
        Description: "Second dish's description",
        Price: "12"
    },
    "Dish 3": {
        Description: "Third dish's description",
        Price: "11.50"
    }
}

function savePrivateDialogData(session, data) {
    if(!session | !data) throw Error("Missing saving argument")
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
    (session) => session.beginDialog('reservation'),
    (session) => session.beginDialog('chooseMenu'),
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
bot.dialog('chooseMenu', [
    (session) => builder.Prompts.choice(session, "Choose a menu", menu),
    (session, results) => {
        savePrivateDialogData(session, { testChoice: menu[results.response.entity] })
        session.send(`${results.response.entity}, you got it !`)
        session.endDialog()
    }
]).triggerAction({
    matches: /^choose menu$/i,
    confirmPrompt: "This will cancel your order. Are you sure?"
});
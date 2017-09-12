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



const bot = new builder.UniversalBot(connector, (session) => {
    session.send(`session.message.type ${session.message.type}`) 
    session.send(`it's working !`)
    session.send(`msg: ${session.message.text}`)
    session.send(`msg length: ${session.message.text.length}`)
    session.send(`DialogData: ${JSON.stringify(session.dialogData)}`)
})

bot.on('typing', (message) => {
    const reply = new builder.Message()
        .address(message.address)
        .text(`coucou typing`);
    bot.send(reply);
})

bot.dialog('firstRun', (session) => {
    session.userData.firstRun = true;
    session.send("Hello moto").endDialog();
}).triggerAction({
    onFindAction: (context, callback) => {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1);
        } else 
            callback(null, 0.0);
    }
});

bot.on('conversationUpdate', (message) => {
    if (message.membersAdded && message.membersAdded.length > 0) {
        // Say hello
        const isGroup = message.address.conversation.isGroup;
        const txt = isGroup ? "Hello new comers!" : "Yo dude";
        const reply = new builder.Message()
            .address(message.address)
            .text(txt);
        bot.send(reply);
    } else if (message.membersRemoved) {
        // See if bot was removed
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                var reply = new builder.Message()
                    .address(message.address)
                    .text("Bb babe");
                bot.send(reply);
                break;
            }
        }
    }
});
const builder = require('botbuilder')
const restify = require('restify')
const HEAVY_WORK_TIMELAPSE = 4000;

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

const generateTypingNotice = (session) => {
    session.sendTyping();
    setTimeout(() => {
        session.send(`Man that was heavy`);
    }, HEAVY_WORK_TIMELAPSE);
};

const bot = new builder.UniversalBot(connector, (session) => {
    const {text} = session.message;
    if ( text === 'doheavywork' )
        return generateTypingNotice(session);
    session.send(`session.message.type ${session.message.type}`) 
    session.send(`it's working !`)
    session.send(`msg: ${text}`)
    session.send(`msg length: ${text.length}`)
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
    if (message.membersAdded && message.membersAdded.length && message.membersAdded.find(m => m.id !== message.address.bot.id) ) {
        const isGroup = message.address.conversation.isGroup;
        const txt = isGroup ? "Hello new comers!" : `Welcome ${message.membersAdded.map(curUser => curUser.name).toString()}`;
        const reply = new builder.Message()
            .address(message.address)
            .text(txt);
        bot.send(reply);
    } else if (message.membersRemoved) {
        const botId = message.address.bot.id;
        if (message.membersRemoved.find(leavingMember => leavingMember.id === botId ) ) {
            bot.send(new builder.Message()
                .address(message.address)
                .text("Bb bottee"));
        }
    }
});